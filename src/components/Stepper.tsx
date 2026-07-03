import { Children, type ReactNode, useEffect, useMemo, useState } from "react";
import "./Stepper.css";

interface StepperProps {
  children: ReactNode;
  labels?: string[];
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  beforeNext?: (step: number) => boolean | Promise<boolean>;
  backButtonText?: string;
  nextButtonText?: string;
  finalButtonText?: string;
  disableStepIndicators?: boolean;
  loading?: boolean;
}

interface StepProps {
  children: ReactNode;
}

export function Step({ children }: StepProps) {
  return <div className="platform-step">{children}</div>;
}

export default function Stepper({
  children,
  labels,
  initialStep = 1,
  onStepChange,
  onFinalStepCompleted,
  beforeNext,
  backButtonText = "上一步",
  nextButtonText = "下一步",
  finalButtonText = "完成",
  disableStepIndicators = false,
  loading = false,
}: StepperProps) {
  const steps = useMemo(() => Children.toArray(children), [children]);
  const totalSteps = steps.length;
  const safeInitialStep = Math.min(Math.max(initialStep, 1), Math.max(totalSteps, 1));
  const [currentStep, setCurrentStep] = useState(safeInitialStep);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  const goToStep = (step: number) => {
    if (step === currentStep || step < 1 || step > totalSteps) return;
    setDirection(step > currentStep ? "forward" : "back");
    setCurrentStep(step);
  };

  const handleBack = () => {
    goToStep(currentStep - 1);
  };

  const handleNext = async () => {
    if (checking || loading) return;
    setChecking(true);
    try {
      const canContinue = beforeNext ? await beforeNext(currentStep) : true;
      if (!canContinue) return;
      if (currentStep === totalSteps) {
        onFinalStepCompleted?.();
      } else {
        goToStep(currentStep + 1);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="platform-stepper">
      {!disableStepIndicators && (
        <div className="platform-stepper-track" aria-label="注册步骤">
          {steps.map((_, index) => {
            const step = index + 1;
            const status = step < currentStep ? "complete" : step === currentStep ? "active" : "pending";
            return (
              <button
                key={step}
                type="button"
                className={`platform-stepper-node is-${status}`}
                onClick={() => {
                  if (step < currentStep) goToStep(step);
                }}
                disabled={step > currentStep}
                aria-current={step === currentStep ? "step" : undefined}
              >
                <span className="platform-stepper-mark">{status === "complete" ? "✓" : step}</span>
                <span className="platform-stepper-label">{labels?.[index] ?? `步骤 ${step}`}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className={`platform-stepper-content is-${direction}`}>
        {steps.map((step, index) => (
          <div key={index + 1} className={`platform-step-content ${index + 1 === currentStep ? "is-active" : "is-hidden"}`}>
            {step}
          </div>
        ))}
      </div>

      <div className={`platform-stepper-footer ${currentStep === 1 ? "is-end" : ""}`}>
        {currentStep > 1 && (
          <button type="button" className="platform-stepper-back" onClick={handleBack} disabled={checking || loading}>
            {backButtonText}
          </button>
        )}
        <button type="button" className="platform-stepper-next" onClick={handleNext} disabled={checking || loading}>
          {currentStep === totalSteps ? finalButtonText : nextButtonText}
        </button>
      </div>
    </div>
  );
}
