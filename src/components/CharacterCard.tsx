import React from 'react';
import { CharacterTemplate } from '../utils/characterTemplates';
import { Sparkles, Check } from 'lucide-react';

interface CharacterCardProps {
  template: CharacterTemplate;
  isSelected?: boolean;
  onSelect: (template: CharacterTemplate) => void;
  compact?: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  template,
  isSelected = false,
  onSelect,
  compact = false
}) => {
  return (
    <div
      onClick={() => onSelect(template)}
      className={`group relative cursor-pointer rounded-xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col overflow-hidden border-2 ${
        isSelected
          ? 'bg-purple-950/70 border-orange-500 glow-orange shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/50'
          : 'bg-[#180b2a]/80 border-purple-900/60 hover:border-purple-500/80 hover:bg-[#200f38]'
      }`}
    >
      {/* Top Banner & Badge */}
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-900/80 border border-purple-700/50 text-purple-200">
          {template.badge || template.category}
        </span>
        {isSelected && (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-black animate-pulse">
            <Check className="w-3 h-3 stroke-[3]" /> Active
          </span>
        )}
      </div>

      {/* Body Thumbnail Preview */}
      <div className={`relative flex items-center justify-center p-3 ${compact ? 'h-36' : 'h-48'}`}>
        <div
          className="absolute inset-4 rounded-full opacity-20 filter blur-xl group-hover:opacity-40 transition-opacity duration-300"
          style={{ backgroundColor: template.accentColor || '#ff6a00' }}
        />
        <img
          src={template.bodyImagePath}
          alt={template.name}
          className="relative max-h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Details Footer */}
      <div className="p-3 pt-1 border-t border-purple-900/40 bg-[#120721]/90">
        <h4 className="font-['Creepster'] text-lg text-orange-400 tracking-wide truncate group-hover:text-orange-300">
          {template.name}
        </h4>
        {!compact && template.tagline && (
          <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">
            {template.tagline}
          </p>
        )}
      </div>

      {/* Subtle selection sparkle */}
      {isSelected && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <Sparkles className="w-4 h-4 text-orange-400 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      )}
    </div>
  );
};
