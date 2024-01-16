import type { ReactNode } from 'react';
import {
  PartyPopper,
  RefreshCcw,
  SkipForward,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import type { QuestionProgressType } from './QuestionsList';

type ProgressStatButtonProps = {
  isDisabled?: boolean;
  icon: ReactNode;
  label: string;
  count: number;
  onClick: () => void;
};

function ProgressStatButton(props: ProgressStatButtonProps) {
  const { icon, label, count, onClick, isDisabled = false } = props;

  return (
    <button
      disabled={isDisabled}
      onClick={onClick}
      className="group relative flex flex-1 items-center overflow-hidden rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-black transition-colors hover:border-black disabled:pointer-events-none disabled:opacity-50 sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
    >
      {icon}
      <span className="flex flex-grow justify-between">
        <span>{label}</span>
        <span>{count}</span>
      </span>

      <span className="absolute left-0 right-0 top-full flex h-full items-center justify-center border border-black bg-black text-white transition-all duration-200 group-hover:top-0">
        Restart Asking
      </span>
    </button>
  );
}

type QuestionFinishedProps = {
  knowCount: number;
  didNotKnowCount: number;
  skippedCount: number;
  totalCount: number;
  onReset: (type: QuestionProgressType | 'reset') => void;
};

export function QuestionFinished(props: QuestionFinishedProps) {
  const { knowCount, didNotKnowCount, skippedCount, totalCount, onReset } =
    props;

  return (
    <div className="relative flex flex-grow flex-col items-center justify-center px-4 sm:px-0">
      <PartyPopper className="mb-4 mt-10 h-14 w-14 text-gray-300 sm:mt-0 sm:h-24 sm:w-24" />
      <h1 className="text-lg font-semibold text-gray-700 sm:text-2xl">
        Questions Finished
      </h1>
      <p className="mt-0 text-sm text-gray-500 sm:mt-2 sm:text-base">
        Click below revisit{' '}
        <span className="hidden sm:inline">specific or all questions</span>{' '}
        <span className="inline sm:hidden">questions</span>
      </p>

      <div className="mb-5 mt-5 flex w-full flex-col gap-1.5 px-2 sm:flex-row sm:gap-3 sm:px-16">
        <ProgressStatButton
          icon={<ThumbsUp className="mr-1 h-4" />}
          label="Knew"
          count={knowCount}
          isDisabled={knowCount === 0}
          onClick={() => onReset('know')}
        />
        <ProgressStatButton
          icon={<Sparkles className="mr-1 h-4" />}
          label="Learned"
          count={didNotKnowCount}
          isDisabled={didNotKnowCount === 0}
          onClick={() => onReset('dontKnow')}
        />
        <ProgressStatButton
          icon={<SkipForward className="mr-1 h-4" />}
          label="Skipped"
          count={skippedCount}
          isDisabled={skippedCount === 0}
          onClick={() => onReset('skip')}
        />
      </div>
      <div className="mb-4 mt-2 text-sm sm:mb-0">
        <button
          onClick={() => onReset('reset')}
          className="flex items-center gap-0.5 text-sm text-red-700 hover:text-black sm:text-base"
        >
          <RefreshCcw className="mr-1 h-4" />
          Restart Asking
        </button>
      </div>
    </div>
  );
}
