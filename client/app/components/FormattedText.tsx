import { StyleSheet, Text, TextStyle, Linking, NativeSyntheticEvent, TextLayoutEventData } from "react-native"
import { Link } from "expo-router"

type TextPart = {
  text: string
  type: 'plain' | 'hashtag' | 'bold' | 'italic' | 'underline' | 'header' | 'link' | 'escaped' | 'url' | 'strikethrough'
  url?: string
}

const FormattedText = ({ text, color = '#000', style, isPressable = false, numberOfLines, onTextLayout, selectable = false }: { 
  text: string, 
  color?: string, 
  style?: TextStyle, 
  isPressable?: boolean 
  numberOfLines?: number
  selectable?: boolean
  onTextLayout?: (e: NativeSyntheticEvent<TextLayoutEventData>) => void;
}) => {
  const parseText = (input: string): TextPart[] => {
    const parts: TextPart[] = []
    let remaining = input

    const patterns: { regex: RegExp; type: TextPart['type'] }[] = [
      { regex: /(~.)/g, type: 'escaped' },
      { regex: /(^|\s)(#[a-zA-Zа-яА-Я0-9_]+)/g, type: 'hashtag' },
      { regex: /\*\*(.*?)\*\*/g, type: 'bold' },
      { regex: /\*(.*?)\*/g, type: 'italic' },
      { regex: /__(.*?)__/g, type: 'underline' },
      { regex: /^#\s(.*$)/gm, type: 'header' },
      { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link' },
      { 
        regex: /(https?:\/\/[^\s]+|www\.[^\s]+)/g, 
        type: 'url' 
      },
      { regex: /--(.*?)--/g, type: 'strikethrough' }
    ]

    while (remaining.length > 0) {
      let earliestMatch: { 
        index: number
        length: number
        type: TextPart['type']
        text: string
        url?: string
        prefixLength?: number
      } | null = null

      for (const { regex, type } of patterns) {
        regex.lastIndex = 0
        const match = regex.exec(remaining)
        
        if (match) {
          let matchedText = ''
          let url = ''
          
          if (type === 'escaped') {
            matchedText = match[0][1]
          } else if (type === 'hashtag') {
            matchedText = match[2]
          } else if (type === 'link') {
            matchedText = match[1]
            url = match[2]
          } else if (type === 'header') {
            matchedText = match[1]
          } else if (type === 'url') {
            matchedText = match[0]
            url = match[0].startsWith('www.') ? `http://${match[0]}` : match[0]
          } else if (type === 'strikethrough') {
            matchedText = match[1]
          } else {
            matchedText = match[1]
          }

          const prefixLength = type === 'hashtag' ? match[1]?.length || 0 : 0
          
          if (!earliestMatch || match.index < earliestMatch.index) {
            earliestMatch = {
              index: match.index,
              length: match[0].length,
              type,
              text: matchedText,
              url,
              prefixLength
            }
          }
        }
      }

      if (earliestMatch) {
        const textBefore = remaining.substring(
          0, 
          earliestMatch.index + (earliestMatch.prefixLength || 0)
        )
        
        if (textBefore) {
          parts.push({
            text: textBefore,
            type: 'plain'
          })
        }

        parts.push({
          text: earliestMatch.text,
          type: earliestMatch.type,
          url: earliestMatch.url
        })

        remaining = remaining.substring(
          earliestMatch.index + earliestMatch.length
        )
      } else {
        parts.push({
          text: remaining,
          type: 'plain'
        })
        remaining = ''
      }
    }

    return parts
  }

  const handleLinkPress = (url: string) => {
    try {
      if (url.startsWith('/') || url.startsWith('#')) {
      } else {
        Linking.openURL(url).catch(() => {
          return
        })
      }
    } catch (error) {
      return
    }
  }

  const renderPart = (part: TextPart, index: number) => {
    switch (part.type) {
      case 'escaped':
        return (
          <Text key={index} style={[styles.plainText, { color }]}>
            {part.text}
          </Text>
        )
      case 'hashtag':
        if (isPressable) {
          return (
            <Link 
              key={index} 
              style={[styles.hashtag, { color: '#487589' }]}
              href={`/search/${encodeURIComponent(part.text)}`}
            >
              {part.text}
            </Link>
          )
        }
        return (
          <Text key={index} style={[styles.hashtag, { color: '#487589' }]}>
            {part.text}
          </Text>
        )
      case 'bold':
        return (
          <Text key={index} style={[styles.boldText, { color }]}>
            {part.text}
          </Text>
        )
      case 'italic':
        return (
          <Text key={index} style={[styles.italicText, { color }]}>
            {part.text}
          </Text>
        )
      case 'underline':
        return (
          <Text key={index} style={[styles.underlineText, { color }]}>
            {part.text}
          </Text>
        )
      case 'header':
        return (
          <Text key={index}>
            <Text style={[styles.headerText, { color }]}>{part.text}</Text>
          </Text>
        )
      case 'link':
      case 'url': 
        return (
          <Text 
            key={index} 
            style={[styles.linkText, { color: '#487589' }]}
            onPress={() => part.url && handleLinkPress(part.url)}
          >
            {part.type === 'link' ? part.text : part.url}
          </Text>
        )
      case 'strikethrough':
        return (
          <Text key={index} style={[styles.strikethroughText, { color }]}>
            {part.text}
          </Text>
        )
      default:
        return (
          <Text key={index} style={[styles.plainText, { color }]}>
            {part.text}
          </Text>
        )
    }
  }

  const parts = parseText(text)

  return (
    <Text 
      style={[styles.container, style, { color }]}
      numberOfLines={numberOfLines}
      ellipsizeMode="tail"
      onTextLayout={onTextLayout}
      selectable={selectable}
    >
      {parts.map(renderPart)}
    </Text>
  )
}

const styles = StyleSheet.create({
  container: {
    fontSize: 16,
    lineHeight: 24,
  },
  plainText: {},
  hashtag: {
    fontWeight: 'bold',
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  strikethroughText: {
    textDecorationLine: 'line-through',
  },
})

export default FormattedText