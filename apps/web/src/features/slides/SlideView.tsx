import type { Slide } from '@pyquest/content-schema';
import { catalog, type CatalogCourse } from '../../content/catalog';
import type { LessonState } from '../../storage/store';
import { AssetPicker } from './widgets/AssetPicker';
import { Flipbook } from './widgets/Flipbook';
import { Gravity } from './widgets/Gravity';
import { Grid } from './widgets/Grid';
import { RoadmapBuilder } from './widgets/RoadmapBuilder';
import { SampleGame } from './widgets/SampleGame';

export type WidgetContext = {
  course: CatalogCourse;
  state: LessonState;
  update: (patch: Partial<LessonState>) => void;
};

/**
 * One slide. With a picture or widget: two columns, words left (≈40%), the visual big on the right.
 * Without: one centred column. Present mode only makes the type bigger.
 */
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
  const visual = slide.widget !== undefined || image !== undefined;

  const words = (
    <div
      className={`flex min-w-0 flex-col justify-center gap-5 ${visual ? '' : 'mx-auto w-full max-w-3xl'}`}
    >
      {slide.title !== undefined && (
        <h2 className={`text-brand-deep ${big ? 'text-6xl' : 'text-4xl'}`}>{slide.title}</h2>
      )}
      {slide.text !== undefined && (
        <p className={`whitespace-pre-line leading-relaxed ${big ? 'text-[30px]' : 'text-[22px]'}`}>
          {slide.text}
        </p>
      )}
      {slide.quiz !== undefined && (
        <Quiz quiz={slide.quiz} big={big} answer={answer} onAnswer={onAnswer} />
      )}
    </div>
  );

  if (!visual) {
    return (
      <article className="flex h-full min-h-0 items-center" data-testid={`slide-${slide.id}`}>
        {words}
      </article>
    );
  }
  return (
    <article
      className="grid h-full min-h-0 grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 max-[1100px]:gap-5"
      data-testid={`slide-${slide.id}`}
    >
      {words}
      <div className="flex min-h-0 min-w-0 items-stretch rounded-[var(--radius-card)] border-2 border-ink bg-paper p-4 shadow-hard">
        {image !== undefined && (
          <img src={image} alt="" className="mx-auto max-h-full max-w-full object-contain" />
        )}
        {slide.widget?.kind === 'sampleGame' && <SampleGame source={ctx.course.sampleGame ?? ''} />}
        {slide.widget?.kind === 'grid' && <Grid />}
        {slide.widget?.kind === 'gravity' && <Gravity />}
        {slide.widget?.kind === 'flipbook' && <Flipbook />}
        {slide.widget?.kind === 'assetPicker' && (
          <AssetPicker
            group={
              typeof slide.widget.props?.['group'] === 'string'
                ? slide.widget.props['group']
                : 'bird'
            }
            picked={ctx.state.picks?.['bird']}
            onPick={(id) => {
              ctx.update({ picks: { ...ctx.state.picks, bird: id } });
            }}
          />
        )}
        {slide.widget?.kind === 'roadmapBuilder' && (
          <RoadmapBuilder
            parts={ctx.course.roadmap}
            order={ctx.state.roadmapOrder}
            onChange={(roadmapOrder) => {
              ctx.update({ roadmapOrder });
            }}
          />
        )}
      </div>
    </article>
  );
}

function Quiz({
  quiz,
  big,
  answer,
  onAnswer,
}: {
  quiz: NonNullable<Slide['quiz']>;
  big: boolean;
  answer: number | undefined;
  onAnswer: (i: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3" data-testid="quiz">
      <p className={`font-display font-extrabold ${big ? 'text-4xl' : 'text-[26px]'}`}>
        ❓ {quiz.question}
      </p>
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
              className={`flex min-h-14 items-center gap-3 rounded-[12px] border-2 px-4 text-left shadow-hard transition-transform active:translate-y-[2px] ${big ? 'text-2xl' : 'text-xl'} ${picked ? (right ? 'border-go bg-go/15' : 'border-oops bg-oops-soft') : 'border-ink bg-white hover:bg-brand-soft'}`}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper font-pixel text-xl">
                {picked ? (right ? '✓' : '✗') : String.fromCharCode(65 + i)}
              </span>
              {c}
            </button>
          );
        })}
      </div>
      {answer !== undefined && (
        <p
          className={`rounded-[12px] p-4 text-lg ${answer === quiz.answer ? 'bg-go/15' : 'bg-oops-soft'}`}
          data-testid="quiz-explain"
        >
          <b>{answer === quiz.answer ? 'Đúng rồi! ' : 'Chưa đúng, em thử chọn lại nhé.'}</b>
          {answer === quiz.answer ? quiz.explain : ''}
        </p>
      )}
    </div>
  );
}
