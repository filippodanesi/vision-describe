
import React from 'react';
import FeatureItem from './FeatureItem';
import { VersionData } from './types';

interface VersionItemProps {
  version: VersionData;
  isLast: boolean;
}

const VersionItem: React.FC<VersionItemProps> = ({ version, isLast }) => {
  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-[9px] top-11 w-0.5 h-[calc(100%-16px)] bg-muted"></div>
      )}
      
      <div className="flex gap-6">
        {/* Timeline bullet */}
        <div className="relative w-4 h-4 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
        
        <div className="flex-grow">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h3 className="text-lg font-medium">Version {version.version}</h3>
            <span className="text-sm text-muted-foreground">{version.date}</span>
          </div>
          
          <ul className="space-y-2 pl-1">
            {version.features.map((feature, idx) => (
              <FeatureItem key={idx} feature={feature} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VersionItem;
