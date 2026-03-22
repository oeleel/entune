import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { pdfStyles } from './styles';

/**
 * Renders simple markdown (bold, numbered lists, bullet lists) as PDF elements.
 * Only handles patterns used in Claude SOAP output.
 */
export function renderMarkdown(text: string): React.ReactElement[] {
  const lines = text.split('\n');
  const elements: React.ReactElement[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Numbered list item: "1. text"
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <View key={i} style={{ flexDirection: 'row', marginBottom: 3, paddingLeft: 8 }}>
          <Text style={pdfStyles.body}>{numberedMatch[1]}. </Text>
          <Text style={[pdfStyles.body, { flex: 1 }]}>{renderInline(numberedMatch[2])}</Text>
        </View>
      );
      continue;
    }

    // Bullet list item: "- text" or "* text"
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <View key={i} style={{ flexDirection: 'row', marginBottom: 3, paddingLeft: 8 }}>
          <Text style={pdfStyles.body}>{'\u2022 '}</Text>
          <Text style={[pdfStyles.body, { flex: 1 }]}>{renderInline(bulletMatch[1])}</Text>
        </View>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <Text key={i} style={[pdfStyles.body, { marginBottom: 4 }]}>
        {renderInline(trimmed)}
      </Text>
    );
  }

  return elements;
}

/** Renders inline bold markers (**text**) within a line. */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return <Text key={i} style={{ fontWeight: 700 }}>{boldMatch[1]}</Text>;
    }
    return <Text key={i}>{part}</Text>;
  });
}
