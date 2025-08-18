import React, { useState, useEffect, useRef } from 'react';
import { Navigation, ArrowRight, ArrowLeft, ArrowUp, RotateCcw, MapPin, Volume2, VolumeX } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';

interface NavigationStep {
  id: string;
  instruction: string;
  maneuver: 'turn-left' | 'turn-right' | 'straight' | 'u-turn' | 'exit' | 'merge' | 'arrival';
  distance: number; // meters
  duration: number; // seconds
  streetName: string;
  nextStreetName?: string;
}

interface TurnByTurnNavigationProps {
  steps: NavigationStep[];
  currentStepIndex: number;
  totalDistance: number;
  totalDuration: number;
  currentSpeed: number; // km/h
  onRecalculateRoute?: () => void;
  onToggleVoice?: (enabled: boolean) => void;
  className?: string;
}

export default function TurnByTurnNavigation({
  steps,
  currentStepIndex,
  totalDistance,
  totalDuration,
  currentSpeed,
  onRecalculateRoute,
  onToggleVoice,
  className = ''
}: TurnByTurnNavigationProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [eta, setETA] = useState<Date>(new Date());
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  const currentStep = steps[currentStepIndex] || null;
  const nextStep = steps[currentStepIndex + 1] || null;

  // Calculate ETA based on remaining distance and current speed
  useEffect(() => {
    if (currentSpeed > 0) {
      const remainingDistance = steps
        .slice(currentStepIndex)
        .reduce((total, step) => total + step.distance, 0);
      const remainingTimeHours = remainingDistance / 1000 / currentSpeed;
      const remainingTimeMs = remainingTimeHours * 60 * 60 * 1000;
      setETA(new Date(Date.now() + remainingTimeMs));
    }
  }, [currentStepIndex, currentSpeed, steps]);

  // Voice navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const speakInstruction = (instruction: string) => {
    if (!voiceEnabled || !synthesisRef.current) return;
    
    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(instruction);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    synthesisRef.current.speak(utterance);
  };

  // Speak instruction when step changes
  useEffect(() => {
    if (currentStep && voiceEnabled) {
      const distance = currentStep.distance;
      let distanceText = '';
      
      if (distance > 1000) {
        distanceText = `In ${Math.round(distance / 100) / 10} kilometers, `;
      } else if (distance > 100) {
        distanceText = `In ${Math.round(distance / 10) * 10} meters, `;
      } else {
        distanceText = distance < 50 ? 'Now, ' : `In ${distance} meters, `;
      }
      
      speakInstruction(distanceText + currentStep.instruction);
    }
  }, [currentStepIndex, voiceEnabled]);

  const getManeuverIcon = (maneuver: string, size: number = 24) => {
    const iconProps = { size, className: "text-white" };
    
    switch (maneuver) {
      case 'turn-left':
        return <ArrowLeft {...iconProps} />;
      case 'turn-right':
        return <ArrowRight {...iconProps} />;
      case 'straight':
        return <ArrowUp {...iconProps} />;
      case 'u-turn':
        return <RotateCcw {...iconProps} />;
      case 'arrival':
        return <MapPin {...iconProps} />;
      default:
        return <Navigation {...iconProps} />;
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleVoiceToggle = () => {
    const newVoiceState = !voiceEnabled;
    setVoiceEnabled(newVoiceState);
    onToggleVoice?.(newVoiceState);
    
    if (!newVoiceState && synthesisRef.current) {
      synthesisRef.current.cancel();
    }
  };

  if (!currentStep) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">No navigation data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {/* Main Navigation Instruction */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            currentStep.maneuver === 'arrival' ? 'bg-green-500' : 'bg-blue-600'
          } shadow-lg`}>
            {getManeuverIcon(currentStep.maneuver, 32)}
          </div>
          
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-900 mb-1">
              {formatDistance(currentStep.distance)}
            </div>
            <div className="text-base text-gray-700">
              {currentStep.instruction}
            </div>
            {currentStep.nextStreetName && (
              <div className="text-sm text-gray-500 mt-1">
                toward {currentStep.nextStreetName}
              </div>
            )}
          </div>
        </div>

        {/* Next Step Preview */}
        {nextStep && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                {getManeuverIcon(nextStep.maneuver, 16)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">
                  Then {nextStep.instruction}
                </div>
                <div className="text-xs text-gray-500">
                  {nextStep.streetName}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {formatDistance(nextStep.distance)}
              </div>
            </div>
          </div>
        )}

        {/* Trip Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">
              {formatDistance(totalDistance)}
            </div>
            <div className="text-xs text-gray-500">Total Distance</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {formatDuration(totalDuration)}
            </div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">
              {eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-gray-500">ETA</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Step {currentStepIndex + 1} of {steps.length}</span>
            <span>{Math.round((currentStepIndex / steps.length) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStepIndex / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleVoiceToggle}
            variant={voiceEnabled ? "default" : "outline"}
            size="sm"
            className="flex-1"
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="ml-2">{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
          </Button>
          
          {onRecalculateRoute && (
            <Button
              onClick={onRecalculateRoute}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Navigation size={16} className="mr-2" />
              Recalculate
            </Button>
          )}
        </div>

        {/* Speed Indicator */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Speed</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-600">
                {Math.round(currentSpeed)}
              </span>
              <span className="text-sm text-gray-500">km/h</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}