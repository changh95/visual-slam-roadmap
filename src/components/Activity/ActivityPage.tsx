import { useEffect, useState } from 'react';
import { httpGet } from '../../lib/http';
import { ActivityCounters } from './ActivityCounters';
import { ResourceProgress } from './ResourceProgress';
import { pageProgressMessage } from '../../stores/page';
import { EmptyActivity } from './EmptyActivity';

type ProgressResponse = {
  updatedAt: string;
  title: string;
  id: string;
  learning: number;
  skipped: number;
  done: number;
  total: number;
  isCustomResource: boolean;
};

export type ActivityResponse = {
  done: {
    today: number;
    total: number;
  };
  learning: {
    today: number;
    total: number;
    roadmaps: ProgressResponse[];
    bestPractices: ProgressResponse[];
    customs: ProgressResponse[];
  };
  streak: {
    count: number;
    firstVisitAt: Date | null;
    lastVisitAt: Date | null;
  };
  activity: {
    type: 'done' | 'learning' | 'pending' | 'skipped';
    createdAt: Date;
    metadata: {
      resourceId?: string;
      resourceType?: 'roadmap' | 'best-practice';
      topicId?: string;
      topicLabel?: string;
      resourceTitle?: string;
    };
  }[];
};

export function ActivityPage() {
  const [activity, setActivity] = useState<ActivityResponse>();
  const [isLoading, setIsLoading] = useState(true);

  async function loadActivity() {
    const { error, response } = await httpGet<ActivityResponse>(
      `${import.meta.env.PUBLIC_API_URL}/v1-get-user-stats`
    );

    if (!response || error) {
      console.error('Error loading activity');
      console.error(error);

      return;
    }

    setActivity(response);
  }

  useEffect(() => {
    loadActivity().finally(() => {
      pageProgressMessage.set('');
      setIsLoading(false);
    });
  }, []);

  const learningRoadmaps = activity?.learning.roadmaps || [];
  const learningBestPractices = activity?.learning.bestPractices || [];

  if (isLoading) {
    return null;
  }

  return (
    <>
      <ActivityCounters
        done={activity?.done || { today: 0, total: 0 }}
        learning={activity?.learning || { today: 0, total: 0 }}
        streak={activity?.streak || { count: 0 }}
      />

      <div className="mx-0 px-0 py-5 md:-mx-10 md:px-8 md:py-8">
        {learningRoadmaps.length === 0 &&
          learningBestPractices.length === 0 && <EmptyActivity />}

        {(learningRoadmaps.length > 0 || learningBestPractices.length > 0) && (
          <>
            <h2 className="mb-3 text-xs uppercase text-gray-400">
              Continue Following
            </h2>
            <div className="flex flex-col gap-3">
              {learningRoadmaps
                .sort((a, b) => {
                  const updatedAtA = new Date(a.updatedAt);
                  const updatedAtB = new Date(b.updatedAt);

                  return updatedAtB.getTime() - updatedAtA.getTime();
                })
                .map((roadmap) => (
                  <ResourceProgress
                    key={roadmap.id}
                    isCustomResource={roadmap.isCustomResource}
                    doneCount={roadmap.done || 0}
                    learningCount={roadmap.learning || 0}
                    totalCount={roadmap.total || 0}
                    skippedCount={roadmap.skipped || 0}
                    resourceId={roadmap.id}
                    resourceType={'roadmap'}
                    updatedAt={roadmap.updatedAt}
                    title={roadmap.title}
                    onCleared={() => {
                      pageProgressMessage.set('Updating activity');
                      loadActivity().finally(() => {
                        pageProgressMessage.set('');
                      });
                    }}
                  />
                ))}

              {learningBestPractices
                .sort((a, b) => {
                  const updatedAtA = new Date(a.updatedAt);
                  const updatedAtB = new Date(b.updatedAt);

                  return updatedAtB.getTime() - updatedAtA.getTime();
                })
                .map((bestPractice) => (
                  <ResourceProgress
                    isCustomResource={bestPractice.isCustomResource}
                    key={bestPractice.id}
                    doneCount={bestPractice.done || 0}
                    totalCount={bestPractice.total || 0}
                    learningCount={bestPractice.learning || 0}
                    resourceId={bestPractice.id}
                    skippedCount={bestPractice.skipped || 0}
                    resourceType={'best-practice'}
                    title={bestPractice.title}
                    updatedAt={bestPractice.updatedAt}
                    onCleared={() => {
                      pageProgressMessage.set('Updating activity');
                      loadActivity().finally(() => {
                        pageProgressMessage.set('');
                      });
                    }}
                  />
                ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
