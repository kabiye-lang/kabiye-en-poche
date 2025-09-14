# NativeWind Migration Guide

This guide documents the migration from `react-native-ui-lib` to `NativeWind` for styling in the Kabiyè en Poche app.

## What Changed

### 1. Styling Approach
- **Before**: Used `react-native-ui-lib` with style props and StyleSheet
- **After**: Using `NativeWind` with Tailwind CSS classes via `className` prop

### 2. Component Structure
- **Before**: Custom themed components with complex prop mapping
- **After**: Clean UI components with NativeWind classes and proper TypeScript types

### 3. Design System
- **Before**: Centralized design system with color/typography constants
- **After**: Tailwind config with custom colors and utilities + design system utilities

## New Components

### UI Components (`components/ui/`)
- `Text` - Typography component with variants and weights
- `View` - Layout component with flex utilities
- `Button` - Button component with variants and sizes
- `Card` - Card component with variants and sub-components
- `ScreenTitle` - Screen title component with safe area handling
- `Gradient` - Gradient component using expo-linear-gradient

### Usage Examples

#### Text Component
```tsx
// Before
<Text h1 family="fig7" style={{ color: Colors.primary }}>
  Title
</Text>

// After
<Text variant="h1" weight="bold" color="primary">
  Title
</Text>
```

#### View Component
```tsx
// Before
<View flex row center style={{ padding: 20 }}>
  Content
</View>

// After
<View flex row center className="p-5">
  Content
</View>
```

#### Button Component
```tsx
// Before
<Button 
  label="Click me" 
  backgroundColor={Colors.primary}
  style={{ borderRadius: 8 }}
/>

// After
<Button variant="primary" size="md">
  Click me
</Button>
```

#### Card Component
```tsx
// Before
<Card 
  padding={20}
  style={{
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  }}
>
  Content
</Card>

// After
<Card variant="elevated" padding="lg">
  Content
</Card>
```

## Migration Steps

### 1. Update Imports
```tsx
// Before
import { Text, View, Button } from '@/components/ui'
import { Card, Colors } from 'react-native-ui-lib'

// After
import { Text, View, Button, Card } from '@/components/ui'
```

### 2. Replace Style Props with className
```tsx
// Before
<View flex row center paddingH-20 marginB-10>

// After
<View flex row center className="px-5 mb-2.5">
```

### 3. Use Component Variants
```tsx
// Before
<Text h1 family="fig7" style={{ color: Colors.primary }}>

// After
<Text variant="h1" weight="bold" color="primary">
```

### 4. Replace Colors with Tailwind Classes
```tsx
// Before
style={{ backgroundColor: Colors.primary, color: Colors.white }}

// After
className="bg-primary text-white"
```

## Tailwind Configuration

The app uses a custom Tailwind config with:
- Brand colors matching the original design system
- Custom font families (IBM Plex Sans Hebrew, Figtree)
- Custom spacing and typography scales
- Card shadows and other custom utilities

## Benefits

1. **Consistency**: All styling uses the same utility classes
2. **Performance**: Smaller bundle size, better tree shaking
3. **Developer Experience**: Better IntelliSense, easier refactoring
4. **Maintainability**: Centralized design tokens in Tailwind config
5. **Responsiveness**: Built-in responsive design utilities
6. **Dark Mode**: Easy dark mode support with `dark:` prefix

## Best Practices

1. **Use component variants** instead of custom className combinations
2. **Leverage the design system utilities** for common patterns
3. **Use the `cn` utility** for conditional classes
4. **Prefer semantic color names** over hex values
5. **Use responsive prefixes** for different screen sizes
6. **Keep components focused** on their specific use case

## Troubleshooting

### Common Issues

1. **Classes not applying**: Check if NativeWind is properly configured
2. **TypeScript errors**: Ensure global.d.ts includes NativeWind types
3. **Build issues**: Verify babel.config.js includes NativeWind plugin
4. **Styling conflicts**: Check for conflicting style props and className

### Debugging

Use the `className` prop to debug styling:
```tsx
<View className="bg-red-500 p-4">Debug view</View>
```

## Next Steps

1. Migrate remaining screens to use NativeWind
2. Remove unused `react-native-ui-lib` dependencies
3. Update design system documentation
4. Add dark mode support
5. Implement responsive design patterns
