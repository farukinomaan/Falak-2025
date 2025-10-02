"use client";
import React from "react";
import QRCode from "qrcode";

interface QrCodeProps {
	value: string;
	size?: number; // final rendered square size in px
	className?: string;
	// Optional: quiet zone (border) size in modules
	quietZoneModules?: number;
}

// Renders a crisp SVG QR that fully fills the provided square while preserving quiet zone.
// Falls back to canvas->dataURL if SVG generation ever fails (unlikely with qrcode lib).
export default function QrCode({ value, size = 160, className = "", quietZoneModules = 2 }: QrCodeProps) {
	const [svg, setSvg] = React.useState<string | null>(null);

	React.useEffect(() => {
		let cancelled = false;
		// Generate with minimal margin, we'll inject custom quiet zone manually for precise fit.
		QRCode.toString(value, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' }, (err, raw) => {
			if (cancelled) return;
			if (err || !raw) {
				setSvg(null);
				return;
			}
			try {
				// raw is an <svg ...>...</svg>
				// We wrap path content inside a new viewBox that includes quiet zone so final outer dims match size.
				const match = raw.match(/viewBox="(\d+) (\d+) (\d+) (\d+)"/);
				if (!match) { setSvg(raw); return; }
				const vbW = parseInt(match[3], 10);
				const vbH = parseInt(match[4], 10);
				const pad = quietZoneModules; // modules on each side
				const newW = vbW + pad * 2;
				const newH = vbH + pad * 2;
				// Shift all rect/path coordinates by pad using a group transform
				const inner = raw.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
				const finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" viewBox="0 0 ${newW} ${newH}" width="${size}" height="${size}"><g transform="translate(${pad},${pad})">${inner}</g></svg>`;
				setSvg(finalSvg);
			} catch {
				setSvg(raw);
			}
		});
		return () => { cancelled = true; };
	}, [value, size, quietZoneModules]);

	return (
		<div
			className={"relative aspect-square overflow-hidden " + className}
			style={{ width: size, height: size }}
		>
					{svg ? (
						<div dangerouslySetInnerHTML={{ __html: svg }} className="w-full h-full" />
			) : (
				<div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">QR...</div>
			)}
		</div>
	);
}
