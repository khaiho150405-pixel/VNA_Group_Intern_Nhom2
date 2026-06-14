import React from 'react';
import { VNA_COLORS } from '@core/theme';

interface RequiredLabelProps {
  label: string;
}

export const RequiredLabel: React.FC<RequiredLabelProps> = ({ label }) => (
  <span>
    {label} <span style={{ color: VNA_COLORS.error, marginLeft: '2px' }}>*</span>
  </span>
);
