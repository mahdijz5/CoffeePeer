import { useStore } from '../store/index.js'
import ComboInput from './ComboInput.jsx'

/** Name field with a dropdown of existing customers that match what is being typed. */
export default function CustomerInput({ value, onChange, placeholder = 'نام مشتری (اختیاری)' }) {
  const customers = useStore((s) => s.customers)
  return (
    <ComboInput
      value={value}
      onChange={onChange}
      options={customers}
      placeholder={placeholder}
      newLabel={(text) => `مشتری جدید «${text}» ذخیره می‌شود`}
    />
  )
}
