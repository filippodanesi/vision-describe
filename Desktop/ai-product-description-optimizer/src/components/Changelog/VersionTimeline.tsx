
import React from 'react';
import VersionItem from './VersionItem';
import { VersionData } from './types';

interface VersionTimelineProps {
  versions: VersionData[];
}

const VersionTimeline: React.FC<VersionTimelineProps> = ({ versions }) => {
  return (
    <div className="space-y-12">
      {versions.map((version, index) => (
        <VersionItem 
          key={version.version} 
          version={version} 
          isLast={index === versions.length - 1}
        />
      ))}
    </div>
  );
};

export default VersionTimeline;
