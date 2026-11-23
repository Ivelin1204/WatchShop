/**
 * Turns the 2D caseback artwork (an <svg> rendered by <WatchBack>) into an
 * image cropped to the sapphire window, for use as the 3D movement texture.
 */
export function movementImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('viewBox', '76 76 248 248');
  clone.setAttribute('width', '768');
  clone.setAttribute('height', '768');
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.querySelectorAll('.rotor, .balance').forEach((n) => (n as SVGElement).removeAttribute('style'));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  });
}
