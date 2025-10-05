# 📱 Expo App Integration - API Reference

Simple guide to connect your existing Expo app to the Kabiye dictionary database.

---

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js @tanstack/react-query
```

### 2. Create Supabase Client

**File: `lib/supabase.ts`** (or wherever you keep clients)

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 3. Add Environment Variables

**File: `.env`**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 📦 TypeScript Types

```typescript
export interface DictionaryEntry {
  id: string
  headword: string
  letter: string
  entry_data: EntryData
  created_at: string
  updated_at: string
}

export interface EntryData {
  letter: string
  headword: string
  plural?: string
  mainEntry?: string  // If present, this is a redirect entry - fetch this headword for full definition
  variantRefs: Array<{ variant: string; pronunciation?: string }>
  pronunciations: string[]
  crossRefs: Array<{ type: string; targets: string[] }>
  grammaticalInfo?: string
  senses: Array<{
    senseNumber?: string | number  // Sense number for display
    definitions: Array<{
      definition: string
      grammar?: string
      translations: {
        fr: string
        en: string
      }
    }>
    examples: Array<{ source?: string; translation?: string }>
    lexRefs: Array<{ type: string; targets: string[] }>  // Moved from entry level to sense level
  }>
  subEntries: Array<{
    type: string
    headword: string
    senses: Array<{
      senseNumber?: string | number
      definitions: Array<{
        definition: string
        grammar?: string
        translations: {
          fr: string
          en: string
        }
      }>
      examples: Array<{ source?: string; translation?: string }>
      lexRefs: Array<{ type: string; targets: string[] }>
    }>
  }>
  publishRoot?: string
  htmlContent?: string
}

export interface SearchResult {
  entry_id: string
  headword: string
  match_type: 'headword' | 'french_translation' | 'english_translation'
  match_text: string
  rank: number
  entry_data: EntryData
}
```

---

## 🔍 API Functions

### Search Dictionary

```typescript
// Search in any language
const { data, error } = await supabase.rpc('search_dictionary', {
  search_query: 'hotel',
  search_language: 'all',  // 'all', 'fr', or 'en'
  result_limit: 20
})

// data is SearchResult[]
```

### Browse by Letter

```typescript
const { data, error } = await supabase.rpc('get_entries_by_letter', {
  letter_param: 'ɛ',
  page_limit: 50,
  page_offset: 0
})

// data is DictionaryEntry[]
```

### Get Specific Entry

```typescript
const { data, error } = await supabase.rpc('get_entry_by_headword', {
  headword_param: 'ɛgɔm'
})

// data is DictionaryEntry[] (single item)
```

### Get Random Entries

```typescript
const { data, error } = await supabase.rpc('get_random_entries', {
  entry_count: 5
})

// data is DictionaryEntry[]
```

### Get Available Letters

```typescript
// Efficient method using RPC function (recommended)
const { data, error } = await supabase.rpc('get_available_letters')

// data is array of { letter: string }
const letters = data?.map(item => item.letter) || []
```

### Get Statistics

```typescript
const { data, error } = await supabase
  .from('dictionary_statistics')
  .select('*')
  .single()

// Returns: { total_entries, total_letters, french_definitions, english_definitions, ... }
```

---

## 🔄 Handling Redirect Entries

Some entries have a `mainEntry` field, indicating they redirect to a main entry. Simply display a message with a link:

```typescript
// File: components/EntryView.tsx
import { supabase } from '@/lib/supabase'
import type { DictionaryEntry } from '@/types/dictionary'

export function EntryView({ entry }: { entry: DictionaryEntry }) {
  // Check if this is a redirect entry
  if (entry.entry_data.mainEntry) {
    return (
      <View style={styles.redirectContainer}>
        <Text style={styles.redirectText}>
          See main entry: 
        </Text>
        <TouchableOpacity
          onPress={async () => {
            const { data } = await supabase.rpc('get_entry_by_headword', {
              headword_param: entry.entry_data.mainEntry
            })
            if (data?.[0]) {
              // Navigate to the main entry
              navigation.push('EntryDetail', { entry: data[0] })
            }
          }}
        >
          <Text style={styles.mainEntryLink}>
            {entry.entry_data.mainEntry}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Regular entry display
  return (
    <View>
      <Text style={styles.headword}>{entry.headword}</Text>
      {/* ... rest of your entry display ... */}
    </View>
  )
}
```

### Helper Function (Optional)

```typescript
// File: lib/dictionary-helpers.ts
export function isRedirectEntry(entry: DictionaryEntry): boolean {
  return !!entry.entry_data.mainEntry
}
```

---

## 💾 React Query Setup (Recommended)

React Query handles caching, offline support, and loading states automatically.

### Setup Query Client

**File: `app/_layout.tsx`** (or your root component)

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import AsyncStorage from '@react-native-async-storage/async-storage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days
      cacheTime: 1000 * 60 * 60 * 24 * 30, // 30 days
      retry: 2,
    },
  },
})

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'KABIYE_DICT_CACHE',
})

export default function RootLayout() {
  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister }}
    >
      {/* Your app */}
    </PersistQueryClientProvider>
  )
}
```

### API Hooks

**File: `hooks/useDictionary.ts`**

```typescript
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DictionaryEntry, SearchResult } from '@/types/dictionary'

// Search dictionary
export function useSearchDictionary(
  query: string,
  language: 'all' | 'fr' | 'en' = 'all',
  enabled = true
) {
  return useQuery({
    queryKey: ['dictionary', 'search', query, language],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_dictionary', {
        search_query: query,
        search_language: language,
        result_limit: 20,
      })
      if (error) throw error
      return data as SearchResult[]
    },
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

// Get entry by headword
export function useEntry(headword: string) {
  return useQuery({
    queryKey: ['dictionary', 'entry', headword],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_entry_by_headword', {
        headword_param: headword,
      })
      if (error) throw error
      return data?.[0] as DictionaryEntry | undefined
    },
    enabled: !!headword,
    staleTime: Infinity, // Entries never change
  })
}

// Browse by letter with pagination
export function useEntriesByLetter(letter: string) {
  return useInfiniteQuery({
    queryKey: ['dictionary', 'letter', letter],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase.rpc('get_entries_by_letter', {
        letter_param: letter,
        page_limit: 50,
        page_offset: pageParam,
      })
      if (error) throw error
      return data as DictionaryEntry[]
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length * 50 : undefined
    },
    staleTime: Infinity,
  })
}

// Get random entries (Word of the Day)
export function useRandomEntries(count = 5) {
  return useQuery({
    queryKey: ['dictionary', 'random', count],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_random_entries', {
        entry_count: count,
      })
      if (error) throw error
      return data as DictionaryEntry[]
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

// Get available letters (efficient RPC-based implementation)
export function useAvailableLetters() {
  return useQuery({
    queryKey: ['dictionary', 'letters'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_letters')
      
      if (error) throw error
      return (data as { letter: string }[])?.map(item => item.letter) || []
    },
    staleTime: Infinity,
  })
}

// Get statistics
export function useDictionaryStats() {
  return useQuery({
    queryKey: ['dictionary', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dictionary_statistics')
        .select('*')
        .single()
      
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}
```

---

## 🎯 Usage in Components

### 1. Search Screen

```typescript
import { useState } from 'react'
import { useSearchDictionary } from '@/hooks/useDictionary'
import { useDebouncedValue } from '@/hooks/useDebounce' // or use-debounce package

function SearchScreen() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  
  const { data, isLoading, error } = useSearchDictionary(debouncedQuery)
  
  return (
    <View>
      <TextInput 
        value={query}
        onChangeText={setQuery}
        placeholder="Search..."
      />
      
      {isLoading && <ActivityIndicator />}
      
      {data?.map(result => (
        <Text key={result.entry_id}>{result.headword}</Text>
      ))}
    </View>
  )
}
```

### 2. Entry Detail Screen

```typescript
import { useEntry } from '@/hooks/useDictionary'

function EntryScreen({ headword }: { headword: string }) {
  const { data: entry, isLoading } = useEntry(headword)
  
  if (isLoading) return <ActivityIndicator />
  if (!entry) return <Text>Not found</Text>
  
  return (
    <ScrollView>
      <Text>{entry.entry_data.headword}</Text>
      
      {entry.entry_data.senses.map((sense, i) => (
        <View key={i}>
          {sense.definitions.map((def, j) => (
            <View key={j}>
              <Text>{def.translations.fr}</Text>
              <Text>{def.translations.en}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}
```

### 3. Browse by Letter with Infinite Scroll

```typescript
import { useEntriesByLetter } from '@/hooks/useDictionary'

function BrowseScreen({ letter }: { letter: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEntriesByLetter(letter)
  
  const entries = data?.pages.flat() || []
  
  return (
    <FlatList
      data={entries}
      renderItem={({ item }) => <Text>{item.headword}</Text>}
      onEndReached={() => hasNextPage && fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? <ActivityIndicator /> : null
      }
    />
  )
}
```

### 4. Word of the Day

```typescript
import { useRandomEntries } from '@/hooks/useDictionary'

function WordOfTheDay() {
  const { data: entries } = useRandomEntries(1)
  const entry = entries?.[0]
  
  if (!entry) return null
  
  return (
    <View>
      <Text>Word of the Day</Text>
      <Text>{entry.headword}</Text>
    </View>
  )
}
```

---

## 🔄 Data Structure Example

When you fetch an entry, `entry_data` looks like this:

```json
{
  "headword": "ɛgɔm",
  "letter": "ɛ",
  "senses": [
    {
      "definitions": [
        {
          "definition": "étranger(ère)",
          "grammar": "n.m.&f.",
          "translations": {
            "fr": "étranger(ère)",
            "en": "foreigner, stranger"
          }
        }
      ],
      "examples": []
    }
  ],
  "subEntries": [
    {
      "type": "expr.",
      "headword": "agɔma ɖɩɣa₂",
      "senses": [
        {
          "definitions": [
            {
              "definition": "hôtel",
              "translations": {
                "fr": "hôtel",
                "en": "hotel"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## ⚡ React Query Benefits

React Query automatically handles:

- ✅ **Caching** - Responses cached in memory and AsyncStorage
- ✅ **Offline support** - Serves cached data when offline
- ✅ **Deduplication** - Multiple components can use same hook
- ✅ **Background refetch** - Updates stale data automatically
- ✅ **Loading states** - `isLoading`, `isFetching` built-in
- ✅ **Error handling** - Automatic retries with exponential backoff

### Additional Tips

1. **Debounce search input** - Wait 300ms after user stops typing
2. **Use infinite queries** - For paginated lists (browse by letter)
3. **Set appropriate staleTime** - Entries never change, so use `Infinity`
4. **Prefetch common queries** - Prefetch popular letters on app start

---

## 🔐 Security

- Use **anon key** in your app (read-only access)
- Never expose **service role key** in client code
- RLS policies ensure users can only read data

---

## 📊 Database Tables

You have access to these tables:

- `dictionary_entries` - Main entries (9,030 rows)
- `reversal_index` - Translation lookup (~18,000 rows)
- `searchable_headwords` - Kabiye terms (~15,000 rows)
- `dictionary_statistics` - Stats view

But you'll mostly use the **RPC functions** listed above.

---

## 🆘 Troubleshooting

### "No results found"
- Check your `search_query` is not empty
- Try `search_language: 'all'` instead of specific language
- Verify data was migrated successfully

### "Connection refused"
- Check `EXPO_PUBLIC_SUPABASE_URL` is correct
- Verify `EXPO_PUBLIC_SUPABASE_ANON_KEY` is set
- Test connection in Supabase dashboard first

### "Slow queries"
- Add pagination (limit results)
- Cache results locally
- Use specific `search_language` when possible

---

That's it! React Query handles caching and offline support automatically. 🚀