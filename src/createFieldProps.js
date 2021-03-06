// @flow
import type { Event, Structure } from './types'

export type Props = {
  asyncError: any,
  asyncValidating: boolean,
  onBlur: { (event: Event, newValue: ?any, previousValue: ?any): void },
  onChange: { (event: Event, newValue: ?any, previousValue: ?any): void },
  onDrop: { (event: Event, newValue: ?any, previousValue: ?any): void },
  onDragStart: { (event: Event): void },
  onFocus: { (event: Event): void },
  dirty: boolean,
  dispatch: { (action: any): void },
  form: string,
  format?: { (value: any, name: string): any },
  initial: any,
  parse?: { (value: any, name: string): any },
  normalize?: { (value: any): any },
  pristine: boolean,
  props?: Object,
  state: any,
  submitError?: string,
  submitFailed: boolean,
  submitting: boolean,
  syncError?: any,
  syncWarning?: any,
  validate?: { (values: any): Object },
  value: any,
  _value: any,
  warn?: { (values: any): Object }
}

type InputProps = {
  onBlur: { (event: any): void },
  onChange: { (event: any): void },
  onDrop: { (event: any): void },
  onDragStart: { (event: any): void },
  onFocus: { (event: any): void },
  value: any
}

type Result = {
  input: InputProps,
  meta: {
    active: boolean,
    asyncValidating: boolean,
    autofilled: boolean,
    dirty: boolean,
    dispatch(action: any): void,
    error: any,
    form: string,
    warning: any,
    invalid: boolean,
    pristine: boolean,
    submitting: boolean,
    submitFailed: boolean,
    touched: boolean,
    valid: boolean,
    visited: boolean
  },
  custom: Object
}

const processProps = (type: string, props: InputProps, _value: any): Object => {
  const { value } = props
  if (type === 'checkbox') {
    return {
      ...props,
      checked: !!value
    }
  }
  if (type === 'radio') {
    return {
      ...props,
      checked: value === _value,
      value: _value
    }
  }
  if (type === 'select-multiple') {
    return {
      ...props,
      value: value || []
    }
  }
  if (type === 'file') {
    return {
      ...props,
      value: value || undefined
    }
  }
  return props
}

const createFieldProps = (
  { getIn, toJS }: Structure<*, *>,
  name: string,
  {
    asyncError,
    asyncValidating,
    onBlur,
    onChange,
    onDrop,
    onDragStart,
    dirty,
    dispatch,
    onFocus,
    form,
    format,
    initial,
    parse, // eslint-disable-line no-unused-vars
    pristine,
    props,
    state,
    submitError,
    submitFailed,
    submitting,
    syncError,
    syncWarning,
    validate, // eslint-disable-line no-unused-vars
    value,
    _value,
    warn, // eslint-disable-line no-unused-vars
    ...custom
  }: Props
): Result => {
  const error = syncError || asyncError || submitError
  const warning = syncWarning

  const formatFieldValue = (value, format) => {
    if (format === null) {
      return value
    }
    const defaultFormattedValue = value == null ? '' : value
    return format ? format(value, name) : defaultFormattedValue
  }

  const formattedFieldValue = formatFieldValue(value, format)

  return {
    input: processProps(
      custom.type,
      {
        name,
        onBlur,
        onChange,
        onDragStart,
        onDrop,
        onFocus,
        value: formattedFieldValue
      },
      _value
    ),
    meta: {
      ...toJS(state),
      active: !!(state && getIn(state, 'active')),
      asyncValidating,
      autofilled: !!(state && getIn(state, 'autofilled')),
      dirty,
      dispatch,
      error,
      form,
      initial,
      warning,
      invalid: !!error,
      pristine,
      submitting: !!submitting,
      submitFailed: !!submitFailed,
      touched: !!(state && getIn(state, 'touched')),
      valid: !error,
      visited: !!(state && getIn(state, 'visited'))
    },
    custom: { ...custom, ...props }
  }
}

export default createFieldProps
