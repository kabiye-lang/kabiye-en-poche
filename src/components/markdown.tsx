import type { ComponentProps } from 'react'

import Markdown, { MarkdownIt } from '@jonasmerlin/react-native-markdown-display'

// Single newlines (\n) render as line breaks in the output
const markdownIt = MarkdownIt({ typographer: true, breaks: true })

interface AppMarkdownProps {
  children: string
  style?: ComponentProps<typeof Markdown>['style']
}

export function AppMarkdown({ children, style }: AppMarkdownProps) {
  return (
    <Markdown markdownit={markdownIt} style={style}>
      {children}
    </Markdown>
  )
}
