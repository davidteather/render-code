import React from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { THEME, COMPOSITION_PREVIEW } from '../../config';

export type ImageCutawayProps = {
	src: string;
	title?: string;
	width?: number | string;
	height?: number | string;
	alt?: string;
	/** When false, hide title; used to only show title while visible/active */
	isActive?: boolean;
};

export const ImageCutaway: React.FC<ImageCutawayProps> = ({ src, title, width, height, alt, isActive = true }) => {
	const frame = useCurrentFrame();
	const { fps, width: compW, height: compH } = useVideoConfig();
	const appear = spring({ frame, fps, durationInFrames: 18, config: { damping: 200 } });
	const resolved = staticFile(src.replace(/^\//, ''));
	const baseW = (COMPOSITION_PREVIEW.width as number) || 1920;
	const baseH = (COMPOSITION_PREVIEW.height as number) || 1080;
	const scaleX = compW / baseW;
	const scaleY = compH / baseH;
	const scaledMaxWidth = typeof width === 'number' ? Math.round(width * scaleX) : undefined;
	const scaledMaxHeight = typeof height === 'number' ? Math.round(height * scaleY) : undefined;
	return (
		<AbsoluteFill style={{ backgroundColor: THEME.stageBackground, justifyContent: 'center', alignItems: 'center' }}>
			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: '100%' }}>
				{isActive && title && (
					<div style={{ color: '#bbb', fontSize: '1.2rem' }}>{title}</div>
				)}
				<img
					src={resolved}
					alt={alt || title || ''}
					style={{
						maxWidth: typeof width === 'string' ? width : (scaledMaxWidth ? `${scaledMaxWidth}px` : '92%'),
						maxHeight: typeof height === 'string' ? height : (scaledMaxHeight ? `${scaledMaxHeight}px` : '92%'),
						objectFit: 'contain',
						borderRadius: 12,
						boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
						transform: `scale(${0.96 + appear * 0.04})`,
						opacity: appear
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};

export default ImageCutaway;

export const GifCutaway: React.FC<ImageCutawayProps> = ({ src, title, width, height, alt, isActive = true }) => {
	// Render GIFs without appear spring to avoid initial stutter/flicker
	const resolved = staticFile(src.replace(/^\//, ''));
	const { width: compW, height: compH } = useVideoConfig();
	const baseW = (COMPOSITION_PREVIEW.width as number) || 1920;
	const baseH = (COMPOSITION_PREVIEW.height as number) || 1080;
	const scaleX = compW / baseW;
	const scaleY = compH / baseH;
	const scaledMaxWidth = typeof width === 'number' ? Math.round(width * scaleX) : undefined;
	const scaledMaxHeight = typeof height === 'number' ? Math.round(height * scaleY) : undefined;
	return (
		<AbsoluteFill style={{ backgroundColor: THEME.stageBackground, justifyContent: 'center', alignItems: 'center' }}>
			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
				{isActive && title && (
					<div style={{ color: '#bbb', fontSize: '1.2rem' }}>{title}</div>
				)}
				<img
					src={resolved}
					alt={alt || title || ''}
					style={{
						maxWidth: typeof width === 'string' ? width : (scaledMaxWidth ? `${scaledMaxWidth}px` : '92%'),
						maxHeight: typeof height === 'string' ? height : (scaledMaxHeight ? `${scaledMaxHeight}px` : '92%'),
						objectFit: 'contain',
						borderRadius: 12,
						boxShadow: '0 12px 40px rgba(0,0,0,0.35)'
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};


