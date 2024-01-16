import { ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import { useRef, useState } from 'react';
import { useOutsideClick } from '../hooks/use-outside-click';
import { markdownToHtml } from '../lib/markdown';

type RoadmapTitleQuestionProps = {
  question: string;
  answer: string;
};

export function RoadmapTitleQuestion(props: RoadmapTitleQuestionProps) {
  const { question, answer } = props;

  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClick(ref, () => {
    setIsAnswerVisible(false);
  });

  return (
    <div className="relative hidden border-t text-sm font-medium sm:block">
      {isAnswerVisible && (
        <div className="fixed left-0 right-0 top-0 z-50 h-full items-center justify-center overflow-y-auto overflow-x-hidden overscroll-contain bg-black/50"></div>
      )}
      <h2
        className="z-50 flex cursor-pointer items-center px-2 py-2.5 text-base font-medium"
        aria-expanded={isAnswerVisible ? 'true' : 'false'}
        onClick={(e) => {
          e.preventDefault();
          setIsAnswerVisible(!isAnswerVisible);
        }}
      >
        <span className="flex flex-grow items-center">
          <GraduationCap className="mr-2 inline-block h-6 w-6" />
          {question}
        </span>
        <span className="flex-shrink-0 text-gray-400">
          <ChevronDown className={`inline-block h-5 w-5`} />
        </span>
      </h2>

      <div
        className={`absolute left-0 right-0 top-0 z-50 mt-0 rounded-md border bg-white ${
          isAnswerVisible ? 'block' : 'hidden'
        }`}
        ref={ref}
      >
        {isAnswerVisible && (
          <h2
            className="flex cursor-pointer items-center border-b px-[7px] py-[9px] text-base font-medium"
            onClick={() => setIsAnswerVisible(false)}
          >
            <span className="flex flex-grow items-center">
              <GraduationCap className="mr-2 inline-block h-6 w-6" />
              {question}
            </span>
            <span className="flex-shrink-0 text-gray-400">
              <ChevronUp className={`inline-block h-5 w-5`} />
            </span>
          </h2>
        )}
        <div
          className="bg-gray-100 p-3 text-base [&>h2]:mb-2 [&>h2]:mt-5 [&>h2]:text-[17px] [&>h2]:font-medium [&>p:last-child]:mb-0 [&>p>a]:font-semibold [&>p>a]:underline [&>p>a]:underline-offset-2 [&>p]:mb-3 [&>p]:font-normal [&>p]:leading-relaxed [&>p]:text-gray-800"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(answer, false) }}
        ></div>
      </div>
    </div>
  );
}
