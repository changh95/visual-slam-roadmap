import { ErrorIcon } from "../ReactIcons/ErrorIcon";
import { Spinner } from "../ReactIcons/Spinner";

type ProgressLoadingErrorProps = {
  isLoading: boolean;
  error: string;
}

export function ProgressLoadingError(props: ProgressLoadingErrorProps) {
  const { isLoading, error } = props;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-full items-center justify-center overflow-y-auto overflow-x-hidden overscroll-contain bg-black/50">
    <div className="relative mx-auto flex h-full w-full items-center justify-center">
      <div className="popup-body relative rounded-lg bg-white p-5 shadow">
        <div className="flex items-center">
          {isLoading && (
            <>
              <Spinner className="h-6 w-6" isDualRing={false} />
              <span className="ml-3 text-lg font-semibold">
                Loading user progress...
              </span>
            </>
          )}

          {error && (
            <>
              <ErrorIcon additionalClasses="h-6 w-6 text-red-500" />
              <span className="ml-3 text-lg font-semibold">{error}</span>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
  )
}