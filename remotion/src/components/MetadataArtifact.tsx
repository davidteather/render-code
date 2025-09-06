import React from 'react';
import { Artifact } from 'remotion';
import type { MetadataPayload } from '../types/components';

export const MetadataArtifact: React.FC<{ payload: MetadataPayload }> = ({ payload }) => {
  return (
    <Artifact filename="metadata.json" content={JSON.stringify(payload)} />
  );
};

export default MetadataArtifact;


