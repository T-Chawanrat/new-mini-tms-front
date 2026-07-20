declare module "bwip-js" {
  type ToCanvasOptions = {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
    paddingwidth?: number;
    paddingheight?: number;
    [key: string]: unknown;
  };

  const bwipjs: {
    toCanvas: (canvas: HTMLCanvasElement, options: ToCanvasOptions) => void;
  };

  export default bwipjs;
}