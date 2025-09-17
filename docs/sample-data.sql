-- Sample data for Kabiyè en Poche
-- This script adds sample units and lessons to test the application

-- Insert sample units
INSERT INTO units (code, title_en, title_fr, description_en, description_fr, position) VALUES
('FOUNDATIONS', 'Foundations', 'Fondations', 'Basic building blocks of Kabiyè language', 'Blocs de construction de base de la langue Kabiyè', 1),
('EVERYDAY_LIFE', 'Everyday Life', 'Vie Quotidienne', 'Common daily interactions and activities', 'Interactions et activités quotidiennes courantes', 2),
('TRAVEL', 'Travel', 'Voyage', 'Navigation and transportation', 'Navigation et transport', 3),
('COMMUNITY', 'Community', 'Communauté', 'Social interactions and community life', 'Interactions sociales et vie communautaire', 4),
('GRAMMAR', 'Grammar', 'Grammaire', 'Language structure and rules', 'Structure et règles de la langue', 5),
('COMMUNICATION', 'Communication', 'Communication', 'Advanced communication skills', 'Compétences de communication avancées', 6),
('CULTURE', 'Culture', 'Culture', 'Cultural knowledge and traditions', 'Connaissances et traditions culturelles', 7);

-- Insert sample categories
INSERT INTO categories (name) VALUES
('Alphabet and Sounds'),
('Numbers'),
('Greetings'),
('Family'),
('Time'),
('Food'),
('Clothing'),
('Weather'),
('Directions'),
('Transport'),
('Work'),
('Health'),
('Pronouns'),
('Verbs'),
('Tenses'),
('Questions'),
('Opinions'),
('Traditions'),
('Technology');

-- Insert sample topics
INSERT INTO topics (name) VALUES
('Alphabet'),
('Phonetics'),
('Tones'),
('Numbers'),
('Greetings'),
('Family'),
('Time'),
('Food'),
('Clothing'),
('Weather'),
('Directions'),
('Transport'),
('Work'),
('Health'),
('Pronouns'),
('Verbs'),
('Tenses'),
('Questions'),
('Opinions'),
('Traditions'),
('Technology');

-- Insert sample lessons for Foundations unit
INSERT INTO lessons (unit_id, category_id, position, title_en, title_fr, objectives_en, objectives_fr, difficulty) 
SELECT 
  u.id,
  c.id,
  l.position,
  l.title_en,
  l.title_fr,
  l.objectives_en,
  l.objectives_fr,
  l.difficulty
FROM (VALUES
  (1, 'Alphabet and Sounds', 'Alphabet et Sons', ARRAY['Learn the Kabiyè alphabet', 'Understand vowels, consonants, and tones'], ARRAY['Apprendre l''alphabet Kabiyè', 'Comprendre les voyelles, consonnes et tons'], 'Beginner'),
  (2, 'Vowel Harmony', 'Harmonie Vocalique', ARRAY['Recognize vowel harmony rules'], ARRAY['Reconnaître les règles d''harmonie vocalique'], 'Beginner'),
  (3, 'Tones and Meaning', 'Tons et Signification', ARRAY['Learn how tones change word meaning'], ARRAY['Apprendre comment les tons changent la signification des mots'], 'Beginner'),
  (4, 'Numbers 1-20', 'Nombres 1-20', ARRAY['Count from 1 to 20'], ARRAY['Compter de 1 à 20'], 'Beginner'),
  (5, 'Numbers up to 100', 'Nombres jusqu''à 100', ARRAY['Count higher numbers'], ARRAY['Compter des nombres plus élevés'], 'Beginner')
) AS l(position, title_en, title_fr, objectives_en, objectives_fr, difficulty)
CROSS JOIN units u
CROSS JOIN categories c
WHERE u.code = 'FOUNDATIONS' AND c.name = 'Alphabet and Sounds';

-- Insert sample lessons for Everyday Life unit
INSERT INTO lessons (unit_id, category_id, position, title_en, title_fr, objectives_en, objectives_fr, difficulty) 
SELECT 
  u.id,
  c.id,
  l.position,
  l.title_en,
  l.title_fr,
  l.objectives_en,
  l.objectives_fr,
  l.difficulty
FROM (VALUES
  (1, 'Greetings and Introductions', 'Salutations et Présentations', ARRAY['Greet politely', 'Introduce yourself'], ARRAY['Saluer poliment', 'Se présenter'], 'Beginner'),
  (2, 'Polite Expressions', 'Expressions de Politesse', ARRAY['Say thank you, sorry, please'], ARRAY['Dire merci, désolé, s''il vous plaît'], 'Beginner'),
  (3, 'Meeting New People', 'Rencontrer de Nouvelles Personnes', ARRAY['Ask and answer common questions'], ARRAY['Poser et répondre aux questions courantes'], 'Beginner'),
  (4, 'Talking about Family', 'Parler de la Famille', ARRAY['Name family members'], ARRAY['Nommer les membres de la famille'], 'Beginner'),
  (5, 'Daily Routine', 'Routine Quotidienne', ARRAY['Describe your daily routine'], ARRAY['Décrire votre routine quotidienne'], 'Beginner')
) AS l(position, title_en, title_fr, objectives_en, objectives_fr, difficulty)
CROSS JOIN units u
CROSS JOIN categories c
WHERE u.code = 'EVERYDAY_LIFE' AND c.name = 'Greetings';

-- Insert sample lessons for Travel unit
INSERT INTO lessons (unit_id, category_id, position, title_en, title_fr, objectives_en, objectives_fr, difficulty) 
SELECT 
  u.id,
  c.id,
  l.position,
  l.title_en,
  l.title_fr,
  l.objectives_en,
  l.objectives_fr,
  l.difficulty
FROM (VALUES
  (1, 'Asking for Directions', 'Demander des Directions', ARRAY['Ask for and give directions'], ARRAY['Demander et donner des directions'], 'Intermediate'),
  (2, 'Transportation', 'Transport', ARRAY['Discuss different modes of transport'], ARRAY['Discuter des différents modes de transport'], 'Intermediate'),
  (3, 'At the Airport', 'À l''Aéroport', ARRAY['Navigate airport procedures'], ARRAY['Naviguer dans les procédures d''aéroport'], 'Intermediate'),
  (4, 'Hotel Check-in', 'Enregistrement à l''Hôtel', ARRAY['Check into a hotel'], ARRAY['S''enregistrer dans un hôtel'], 'Intermediate')
) AS l(position, title_en, title_fr, objectives_en, objectives_fr, difficulty)
CROSS JOIN units u
CROSS JOIN categories c
WHERE u.code = 'TRAVEL' AND c.name = 'Directions';

-- Insert sample lessons for Community unit
INSERT INTO lessons (unit_id, category_id, position, title_en, title_fr, objectives_en, objectives_fr, difficulty) 
SELECT 
  u.id,
  c.id,
  l.position,
  l.title_en,
  l.title_fr,
  l.objectives_en,
  l.objectives_fr,
  l.difficulty
FROM (VALUES
  (1, 'Community Events', 'Événements Communautaires', ARRAY['Discuss community activities'], ARRAY['Discuter des activités communautaires'], 'Intermediate'),
  (2, 'Local Traditions', 'Traditions Locales', ARRAY['Learn about cultural traditions'], ARRAY['Apprendre sur les traditions culturelles'], 'Intermediate'),
  (3, 'Social Gatherings', 'Rassemblements Sociaux', ARRAY['Participate in social events'], ARRAY['Participer aux événements sociaux'], 'Intermediate')
) AS l(position, title_en, title_fr, objectives_en, objectives_fr, difficulty)
CROSS JOIN units u
CROSS JOIN categories c
WHERE u.code = 'COMMUNITY' AND c.name = 'Traditions';

-- Insert sample lessons for Grammar unit
INSERT INTO lessons (unit_id, category_id, position, title_en, title_fr, objectives_en, objectives_fr, difficulty) 
SELECT 
  u.id,
  c.id,
  l.position,
  l.title_en,
  l.title_fr,
  l.objectives_en,
  l.objectives_fr,
  l.difficulty
FROM (VALUES
  (1, 'Basic Pronouns', 'Pronoms de Base', ARRAY['Use personal pronouns correctly'], ARRAY['Utiliser les pronoms personnels correctement'], 'Intermediate'),
  (2, 'Verb Conjugation', 'Conjugaison des Verbes', ARRAY['Conjugate verbs in present tense'], ARRAY['Conjuguer les verbes au présent'], 'Intermediate'),
  (3, 'Question Formation', 'Formation des Questions', ARRAY['Ask questions properly'], ARRAY['Poser des questions correctement'], 'Intermediate'),
  (4, 'Past Tense', 'Temps Passé', ARRAY['Express past events'], ARRAY['Exprimer les événements passés'], 'Advanced')
) AS l(position, title_en, title_fr, objectives_en, objectives_fr, difficulty)
CROSS JOIN units u
CROSS JOIN categories c
WHERE u.code = 'GRAMMAR' AND c.name = 'Pronouns';

-- Insert sample lessons for Communication unit
INSERT INTO lessons (unit_id, category_id, position, title_en, title_fr, objectives_en, objectives_fr, difficulty) 
SELECT 
  u.id,
  c.id,
  l.position,
  l.title_en,
  l.title_fr,
  l.objectives_en,
  l.objectives_fr,
  l.difficulty
FROM (VALUES
  (1, 'Expressing Opinions', 'Exprimer des Opinions', ARRAY['Share your thoughts and opinions'], ARRAY['Partager vos pensées et opinions'], 'Advanced'),
  (2, 'Debate and Discussion', 'Débat et Discussion', ARRAY['Engage in formal discussions'], ARRAY['Participer à des discussions formelles'], 'Advanced'),
  (3, 'Public Speaking', 'Prise de Parole en Public', ARRAY['Speak confidently in public'], ARRAY['Parler avec confiance en public'], 'Advanced')
) AS l(position, title_en, title_fr, objectives_en, objectives_fr, difficulty)
CROSS JOIN units u
CROSS JOIN categories c
WHERE u.code = 'COMMUNICATION' AND c.name = 'Opinions';

-- Insert sample lessons for Culture unit
INSERT INTO lessons (unit_id, category_id, position, title_en, title_fr, objectives_en, objectives_fr, difficulty) 
SELECT 
  u.id,
  c.id,
  l.position,
  l.title_en,
  l.title_fr,
  l.objectives_en,
  l.objectives_fr,
  l.difficulty
FROM (VALUES
  (1, 'Traditional Music', 'Musique Traditionnelle', ARRAY['Learn about traditional music'], ARRAY['Apprendre sur la musique traditionnelle'], 'Advanced'),
  (2, 'Cultural Festivals', 'Festivals Culturels', ARRAY['Understand cultural celebrations'], ARRAY['Comprendre les célébrations culturelles'], 'Advanced'),
  (3, 'Oral Traditions', 'Traditions Orales', ARRAY['Learn about storytelling traditions'], ARRAY['Apprendre sur les traditions de conte'], 'Advanced')
) AS l(position, title_en, title_fr, objectives_en, objectives_fr, difficulty)
CROSS JOIN units u
CROSS JOIN categories c
WHERE u.code = 'CULTURE' AND c.name = 'Traditions';

-- Verify the data
SELECT 
  u.title_en as unit_title,
  l.position as lesson_position,
  l.title_en as lesson_title,
  l.difficulty,
  c.name as category
FROM units u
LEFT JOIN lessons l ON u.id = l.unit_id
LEFT JOIN categories c ON l.category_id = c.id
ORDER BY u.position, l.position;
