import { useEffect, useState } from 'react';
import { getUrlParams } from '../../lib/browser';
import {
  type AppError,
  type FetchError,
  httpGet,
  httpPost,
} from '../../lib/http';
import { RoadmapHeader } from './RoadmapHeader';
import { TopicDetail } from '../TopicDetail/TopicDetail';
import type { RoadmapDocument } from './CreateRoadmap/CreateRoadmapModal';
import { currentRoadmap } from '../../stores/roadmap';
import { RestrictedPage } from './RestrictedPage';
import { isLoggedIn } from '../../lib/jwt';
import { FlowRoadmapRenderer } from './FlowRoadmapRenderer';

export const allowedLinkTypes = [
  'video',
  'article',
  'opensource',
  'course',
  'website',
  'podcast',
] as const;

export type AllowedLinkTypes = (typeof allowedLinkTypes)[number];

export interface RoadmapContentDocument {
  _id?: string;
  roadmapId: string;
  nodeId: string;
  title: string;
  description: string;
  links: {
    id: string;
    type: AllowedLinkTypes;
    title: string;
    url: string;
  }[];
}

export type CreatorType = {
  id: string;
  name: string;
  avatar: string;
};

export type GetRoadmapResponse = RoadmapDocument & {
  canManage: boolean;
  creator?: CreatorType;
  team?: CreatorType;
};

export function hideRoadmapLoader() {
  const loaderEl = document.querySelector(
    '[data-roadmap-loader]',
  ) as HTMLElement;
  if (loaderEl) {
    loaderEl.remove();
  }
}

type CustomRoadmapProps = {
  isEmbed?: boolean;
};

export function CustomRoadmap(props: CustomRoadmapProps) {
  const { isEmbed = false } = props;

  const { id, secret } = getUrlParams() as { id: string; secret: string };

  const [isLoading, setIsLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<GetRoadmapResponse | null>(null);
  const [error, setError] = useState<AppError | FetchError | undefined>();

  async function getRoadmap() {
    setIsLoading(true);

    const roadmapUrl = new URL(
      `${import.meta.env.PUBLIC_API_URL}/v1-get-roadmap/${id}`,
    );

    if (secret) {
      roadmapUrl.searchParams.set('secret', secret);
    }

    const { response, error } = await httpGet<GetRoadmapResponse>(
      roadmapUrl.toString(),
    );

    if (error || !response) {
      setError(error);
      setIsLoading(false);
      return;
    }

    document.title = `${response.title} - roadmap.sh`;

    setRoadmap(response);
    currentRoadmap.set(response);
    setIsLoading(false);
  }

  async function trackVisit() {
    if (!isLoggedIn() || isEmbed) {
      return;
    }

    await httpPost(`${import.meta.env.PUBLIC_API_URL}/v1-visit`, {
      resourceId: id,
      resourceType: 'roadmap',
    });
  }

  useEffect(() => {
    getRoadmap().finally(() => {
      hideRoadmapLoader();
    });
    trackVisit().then();
  }, []);

  if (isLoading) {
    return null;
  }

  if (error) {
    return <RestrictedPage error={error} />;
  }

  return (
    <>
      {!isEmbed && <RoadmapHeader />}
      <FlowRoadmapRenderer isEmbed={isEmbed} roadmap={roadmap!} />
      <TopicDetail isEmbed={isEmbed} canSubmitContribution={false} />
    </>
  );
}
