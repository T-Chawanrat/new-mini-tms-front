import { useEffect, useMemo } from "react";
import { createSoundPool } from "../utils/soundPool";

type Options = {
  poolSize?: number;
  volume?: number;
};

export function useScanSounds(
  successSrc: string,
  errorSrc: string,
  opts: Options = {}
) {
  const { poolSize = 6, volume = 1 } = opts;

  const success = useMemo(
    () => createSoundPool(successSrc, poolSize, volume),
    [successSrc, poolSize, volume]
  );

  const error = useMemo(
    () => createSoundPool(errorSrc, poolSize, volume),
    [errorSrc, poolSize, volume]
  );

  useEffect(() => {
    success.load();
    error.load();
    return () => {
      success.destroy();
      error.destroy();
    };
  }, [success, error]);

  return {
    playSuccess: () => success.play(),
    playError: () => error.play(),
  };
}
