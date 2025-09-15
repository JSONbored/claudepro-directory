# /summarize

Intelligently summarizes long documents, articles, or conversations with configurable detail levels.

## Capabilities

- Multi-format support (documents, URLs, conversations)
- Adjustable summary length and detail
- Key points extraction
- Action items identification
- Topic categorization

## Summary Types

### 1. Executive Summary
High-level overview for decision makers

### 2. Detailed Summary
Comprehensive with supporting details

### 3. Bullet Points
Quick scannable format

### 4. Abstract
Academic-style summary

## Syntax

```
/summarize [content] [--options]
```

## Parameters

- `content` (required): Text content, file path, or URL to summarize
- `--length` (optional): Summary length (brief, medium, detailed), default: medium
- `--format` (optional): Output format (bullets, paragraphs, executive), default: paragraphs
- `--focus` (optional): Topics to focus on in the summary

## Examples

### Document Summary
```
/summarize report.pdf --length=brief --format=bullets
```
Create a brief bullet-point summary of a PDF report

### URL Summary
```
/summarize https://example.com/article --focus=["key findings", "recommendations"]
```
Summarize a web article focusing on specific topics

### Executive Summary
```
/summarize meeting-notes.txt --format=executive --length=detailed
```
Generate an executive summary from meeting notes

## Smart Features

- Maintains context and relationships
- Preserves critical information
- Identifies contradictions or gaps
- Suggests follow-up questions

Ideal for research, meeting notes, long articles, and document review.