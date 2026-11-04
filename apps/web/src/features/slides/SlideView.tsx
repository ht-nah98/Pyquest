import type { Slide } from '@pyquest/content-schema';
import { catalog, type CatalogCourse } from '../../content/catalog';
import type { LessonState } from '../../storage/store';
import { Gravity } from './widgets/Gravity';
import { Grid } from './widgets/Grid';
import { RoadmapBuilder } from './widgets/RoadmapBuilder';
import { SampleGame } from './widgets/SampleGame';

export type WidgetContext = {
  course: CatalogCourse;
  state: LessonState;
  update: (patch: Partial<LessonState>) => void;
};

/** One slide: title, short text, picture, interactive widget, quiz. Same view for both modes. */
export function SlideView({
  slide,
  big,
  ctx,
  answer,
  onAnswer,
}: {
  slide: Slide;
  big: boolean;
  ctx: WidgetContext;
  answer: number | undefined;
  onAnswer: (i: number) => void;
}) {
  const image = slide.image === undefined ? undefined : catalog.imageUrl(slide.image);
  const quiz = slide.quiz;
  return (
    <article
      className={`flex min-h-0 flex-1 flex-col gap-4 ${big ? 'text-[28px] leading-snug' : 'text-lg'}`}
      data-testid={`slide-${slide.id}`}
    >
      {slide.title !== undefined && (
        <h2 className={big ? 'text-5xl' : 'text-3xl'}>{slide.title}</h2>
      )}
      {slide.text !== undefined && <p className="max-w-[60ch] whitespace-pre-line">{slide.text}</p>}
      {image !== undefined && (
        <img src={image} alt="" className="max-h-72 self-start [image-rendering:pixelated]" />
      )}
      {slide.widget !== undefined && (
        <div className="min-h-0 flex-1">
          {slide.widget.kind === 'sampleGame' && (
            <SampleGame source={ctx.course.sampleGame ?? ''} />
          )}
          {slide.widget.kind === 'grid' && <Grid />}
          {slide.widget.kind === 'gravity' && <Gravity />}
          {slide.widget.kind === 'roadmapBuilder' && (
            <RoadmapBuilder
              parts={ctx.course.roadmap}
              order={ctx.state.roadmapOrder}
              onChange={(roadmapOrder) => {
                ctx.update({ roadmapOrder });
              }}
            />
          )}
        </div>
      )}
      {quiz !== undefined && (
        <div className="flex flex-col gap-3" data-testid="quiz">
          <p className={big ? 'text-4xl' : 'text-2xl'}>❓ {quiz.question}</p>
          <div className="flex flex-col gap-2">
            {quiz.choices.map((c, i) => {
              const picked = answer === i;
              const right = i === quiz.answer;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onAnswer(i);
                  }}
                  className={`min-h-12 rounded-[10px] border-2 px-4 text-left ${picked ? (right ? 'border-go bg-go/15' : 'border-oops bg-oops-soft') : 'border-ink bg-white'}`}
                >
                  {picked && (right ? '✅ ' : '✗ ')}
                  {c}
                </button>
              );
            })}
          </div>
          {answer !== undefined && (
            <p
              className={`rounded-[10px] p-3 ${answer === quiz.answer ? 'bg-go/15' : 'bg-oops-soft'}`}
              data-testid="quiz-explain"
            >
              {answer === quiz.answer ? 'Đúng rồi! ' : 'Chưa đúng. '}
              {quiz.explain}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
