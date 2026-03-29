declare module "jsqr" {
  interface QRCode {
    data: string;
    binaryData: number[];
    chunks: any[];
    version: number;
    location: {
      topRightCorner: { x: number; y: number };
      topLeftCorner: { x: number; y: number };
      bottomRightCorner: { x: number; y: number };
      bottomLeftCorner: { x: number; y: number };
    };
  }
  function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: { inversionAttempts?: string },
  ): QRCode | null;
  export default jsQR;
}
