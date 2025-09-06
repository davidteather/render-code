import React from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { THEME } from '../../config';

export type ImageCutawayProps = {
	src: string;
	title?: string;
	width?: number;
	height?: number;
	alt?: string;
	/** When false, hide title; used to only show title while visible/active */
	isActive?: boolean;
};

export const ImageCutaway: React.FC<ImageCutawayProps> = ({ src, title, width, height, alt, isActive = true }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const appear = spring({ frame, fps, durationInFrames: 18, config: { damping: 200 } });
	const resolved = staticFile(src.replace(/^\//, ''));
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
						maxWidth: width ? `${width}px` : '92%',
						maxHeight: height ? `${height}px` : '92%',
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
						maxWidth: width ? `${width}px` : '92%',
						maxHeight: height ? `${height}px` : '92%',
						objectFit: 'contain',
						borderRadius: 12,
						boxShadow: '0 12px 40px rgba(0,0,0,0.35)'
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};


