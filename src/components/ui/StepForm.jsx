import React, {
  useState,
  useEffect,
} from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from './Button';
import { getExistingUnits } from '../../services/inventoryService';

/**
 * StepForm – paginated multi-step data entry.
 * Props:
 *  steps: [{ title, field, type, required, options, placeholder, hint }]
 *  onComplete(values): called when user finishes all steps
 *  onCancel(): optional cancel handler
 */
export const StepForm = ({
  steps = [],
  onComplete,
  onCancel,
  submitLabel = 'Submit',
  initialValues = {},
  orgId,
  projectId,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
const [values, setValues] = useState(initialValues);
const [unitSuggestions, setUnitSuggestions] =
  useState([]);
const [error, setError] = useState('');
const [submitting, setSubmitting] = useState(false);

useEffect(() => {
  async function loadUnits() {

    if (
      !orgId ||
      !projectId ||
      !values.name
    ) {
      setUnitSuggestions([]);
      return;
    }

    const units =
      await getExistingUnits(
        orgId,
        projectId,
        values.name
          .trim()
          .toUpperCase()
      );

    setUnitSuggestions(units);
  }

  loadUnits();
}, [
  values.name,
  orgId,
  projectId,
]);

const step = steps[currentStep];
const isLast = currentStep === steps.length - 1;
const progress = ((currentStep) / steps.length) * 100;

  const handleNext = () => {
    if (step.required && !values[step.field]) {
      setError(`${step.title} is required.`);
      return;
    }
    setError('');
    if (isLast) handleSubmit();
    else setCurrentStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try { await onComplete(values); }
    finally { setSubmitting(false); }
  };

  const handleChange = (val) => {
    setValues((prev) => ({ ...prev, [step.field]: val }));
    setError('');
  };

  return (
    <div className="flex flex-col min-h-[320px]">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Step {currentStep + 1} of {steps.length}</span>
          <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{step.title}</h3>
        {step.hint && <p className="text-sm text-gray-500 mb-4">{step.hint}</p>}

        {step.type === 'date' && (
          <input
            type="date"
            value={values[step.field] || ''}
            onChange={(e) =>
  handleChange(e.target.value.toUpperCase())
}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
          />
        )}
        {step.type === 'number' && (
  <input
    type="number"
    placeholder={step.placeholder || '0'}
    value={values[step.field] || ''}
    onChange={(e) => handleChange(e.target.value)}
    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
  />
)}

{step.type === 'number_with_unit' && (
  <div className="flex gap-2">

    <input
      type="number"
      placeholder="0"
      value={values[step.field] || ""}
      onChange={(e) =>
        setValues((prev) => ({
          ...prev,
          [step.field]: e.target.value,
        }))
      }
      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
    />

    <div className="w-36">
      <input
        type="text"
        list={`${step.field}_unit_list`}
        placeholder="UNIT"
        value={
          values[`${step.field}_unit`] || ""
        }
        onChange={(e) =>
          setValues((prev) => ({
            ...prev,
            [`${step.field}_unit`]:
              e.target.value.toUpperCase(),
          }))
        }
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
      />

      <datalist
  id={`${step.field}_unit_list`}
>
  {unitSuggestions.map(
    (unit) => (
      <option
        key={unit}
        value={unit}
      />
    )
  )}
</datalist>
    </div>

  </div>
)}
        {(step.type === 'text' || !step.type) && (
          <input
            type="text"
            placeholder={step.placeholder || `Enter ${step.title}`}
            value={values[step.field] || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
          />
        )}
        {step.type === 'textarea' && (
          <textarea
            placeholder={step.placeholder || `Enter ${step.title}`}
            value={values[step.field] || ''}
            onChange={(e) => handleChange(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 resize-none"
          />
        )}
        {step.type === 'select' && (
          <select
            value={values[step.field] || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 bg-white"
          >
            <option value="">Select {step.title}</option>
            {(step.options || []).map((opt) => (
              <option key={opt.value || opt} value={opt.value || opt}>
                {opt.label || opt}
              </option>
            ))}
          </select>
        )}
        {step.type === 'dropdown' && (
  <div>
    <input
      type="text"
      list={`${step.field}-list`}
      placeholder={step.placeholder || `Enter ${step.title}`}
      value={values[step.field] || ''}
      onChange={(e) => handleChange(e.target.value)}
      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
    />

    <datalist id={`${step.field}-list`}>
      {(step.options || []).map((opt) => {
        const value =
          typeof opt === 'object'
            ? opt.value
            : opt;

        return (
          <option
            key={value}
            value={value}
          />
        );
      })}
    </datalist>
  </div>
)}

        {!step.required && (
          <p className="text-xs text-gray-400 mt-2">Optional – you can skip this field</p>
        )}
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <div>
          {currentStep > 0 ? (
            <Button variant="ghost" onClick={() => { setCurrentStep((s) => s - 1); setError(''); }}>
              <ChevronLeft size={16} /> Back
            </Button>
          ) : (
            onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          )}
        </div>
        <Button onClick={handleNext} loading={submitting && isLast}>
          {isLast ? (
            <><Check size={16} /> {submitLabel}</>
          ) : (
            <>Next <ChevronRight size={16} /></>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepForm;
