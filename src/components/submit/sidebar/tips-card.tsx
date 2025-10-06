import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Lightbulb } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

const TIPS = [
  'Be specific in your descriptions - help users understand what your config does',
  'Add examples in your prompts - they make configs more useful',
  'Test thoroughly before submitting - we review for quality',
  'Use clear names - avoid abbreviations and jargon',
  'Tag appropriately - tags help users discover your work',
];

export function TipsCard() {
  return (
    <Card className="bg-blue-500/5 border-blue-500/20">
      <CardHeader>
        <CardTitle className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} flex items-center gap-2`}>
          <Lightbulb className="h-4 w-4 text-blue-400" />
          💡 Tips for Success
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className={`${UI_CLASSES.SPACE_Y_2} list-none`}>
          {TIPS.map((tip, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-blue-400 text-xs mt-0.5">•</span>
              <span className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                {tip}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
