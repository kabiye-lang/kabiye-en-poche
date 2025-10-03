#!/usr/bin/env python3
"""Backup lessons, lesson_contents, and lesson_activities to SQL file"""

import os
import json
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()


def escape_sql_string(value):
    """Escape single quotes in SQL strings"""
    if value is None:
        return 'NULL'
    if isinstance(value, str):
        return "'" + value.replace("'", "''").replace("\\", "\\\\") + "'"
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (dict, list)):
        # Convert JSON to string and escape
        json_str = json.dumps(value, ensure_ascii=False)
        return "'" + json_str.replace("'", "''").replace("\\", "\\\\") + "'::jsonb"
    return str(value)


def generate_insert_sql(table_name, rows, columns):
    """Generate INSERT SQL statements for a table"""
    if not rows:
        return f"-- No data in {table_name}\n"
    
    sql = f"-- {table_name} ({len(rows)} rows)\n"
    sql += f"INSERT INTO {table_name} ("
    sql += ", ".join(columns)
    sql += ") VALUES\n"
    
    values_list = []
    for row in rows:
        values = []
        for col in columns:
            value = row.get(col)
            values.append(escape_sql_string(value))
        values_list.append("  (" + ", ".join(values) + ")")
    
    sql += ",\n".join(values_list)
    sql += ";\n\n"
    
    return sql


def backup_database():
    """Backup all lessons, contents, and activities to SQL file"""
    
    # Connect to Supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")
    
    supabase: Client = create_client(supabase_url, supabase_key)
    print(f"✅ Connected to Supabase: {supabase_url}")
    
    # Generate backup filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"lessons_backup_{timestamp}.sql"
    
    print(f"\n📦 Creating backup: {backup_file}")
    
    with open(backup_file, 'w', encoding='utf-8') as f:
        # Write header
        f.write("-- ================================================\n")
        f.write("-- Kabiyè en Poche - Lessons Database Backup\n")
        f.write(f"-- Generated: {datetime.now().isoformat()}\n")
        f.write("-- ================================================\n\n")
        f.write("-- This backup includes:\n")
        f.write("--   1. lessons table\n")
        f.write("--   2. lesson_contents table\n")
        f.write("--   3. lesson_activities table\n\n")
        f.write("-- To restore: Run this SQL in your Supabase SQL Editor\n")
        f.write("-- Note: This will NOT delete existing data. Use with caution.\n\n")
        
        # Fetch lessons
        print("📚 Fetching lessons...")
        lessons_response = supabase.table("lessons").select("*").order("position").execute()
        lessons = lessons_response.data
        print(f"   Found {len(lessons)} lessons")
        
        # Fetch lesson contents
        print("📖 Fetching lesson contents...")
        contents_response = supabase.table("lesson_contents").select("*").execute()
        contents = contents_response.data
        print(f"   Found {len(contents)} content sections")
        
        # Fetch lesson activities
        print("🎮 Fetching lesson activities...")
        activities_response = supabase.table("lesson_activities").select("*").order("lesson_id, position").execute()
        activities = activities_response.data
        print(f"   Found {len(activities)} activities")
        
        # Write lessons
        f.write("-- ================================================\n")
        f.write("-- LESSONS\n")
        f.write("-- ================================================\n\n")
        
        if lessons:
            lessons_columns = ['id', 'unit_id', 'category_id', 'position', 'title_en', 'title_fr', 
                             'objectives_en', 'objectives_fr', 'difficulty', 'created_at']
            f.write(generate_insert_sql('lessons', lessons, lessons_columns))
        
        # Write lesson contents
        f.write("-- ================================================\n")
        f.write("-- LESSON CONTENTS\n")
        f.write("-- ================================================\n\n")
        
        if contents:
            contents_columns = ['id', 'lesson_id', 'position', 'title_en', 'title_fr', 'content_en', 'content_fr',
                              'examples_en', 'examples_fr', 'audio_url', 'image_url', 'has_quiz', 'created_at']
            f.write(generate_insert_sql('lesson_contents', contents, contents_columns))
        
        # Write lesson activities
        f.write("-- ================================================\n")
        f.write("-- LESSON ACTIVITIES\n")
        f.write("-- ================================================\n\n")
        
        if activities:
            activities_columns = ['id', 'lesson_id', 'activity_type', 'position', 'question_en', 'question_fr',
                                'instructions_en', 'instructions_fr', 'data', 'audio_url', 'image_url', 'created_at']
            f.write(generate_insert_sql('lesson_activities', activities, activities_columns))
        
        # Write footer
        f.write("-- ================================================\n")
        f.write("-- END OF BACKUP\n")
        f.write("-- ================================================\n")
    
    print(f"\n✅ Backup complete!")
    print(f"📁 File: {backup_file}")
    print(f"📊 Statistics:")
    print(f"   - Lessons: {len(lessons)}")
    print(f"   - Contents: {len(contents)}")
    print(f"   - Activities: {len(activities)}")
    
    # Also create a latest backup without timestamp
    latest_backup = "lessons_backup_latest.sql"
    with open(latest_backup, 'w', encoding='utf-8') as f:
        with open(backup_file, 'r', encoding='utf-8') as source:
            f.write(source.read())
    print(f"\n📋 Also saved as: {latest_backup} (for easy reference)")


if __name__ == "__main__":
    backup_database()

