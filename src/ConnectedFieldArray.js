// @flow
import { Component, createElement } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import createFieldArrayProps from './createFieldArrayProps'
import { mapValues } from 'lodash'
import plain from './structure/plain'
import type { Structure, Context } from './types'

const propsToNotUpdateFor = ['_reduxForm', 'value']

type Props = {
  name: string,
  component: Function | string,
  withRef?: boolean,
  _reduxForm: Context,
  rerenderOnEveryChange?: boolean,
  validate?: { (value: any, allValues: Object, props: Object): any },
  warn?: { (value: any, allValues: Object, props: Object): any },

  // same as Props in createFieldArrayProps.js:
  arrayInsert: { (index: number, value: any): void },
  arrayMove: { (from: number, to: number): void },
  arrayPop: { (): any },
  arrayPush: { (value: any): void },
  arrayRemove: { (index: number): void },
  arrayRemoveAll: { (): void },
  arrayShift: { (): any },
  arraySplice: { (index: number, removeNum: number | null, value: any): void },
  arraySwap: { (from: number, to: number): void },
  arrayUnshift: { (value: any): void },
  asyncError: any,
  dirty: boolean,
  length: number,
  pristine: boolean,
  submitError: any,
  state: Object,
  submitFailed: boolean,
  submitting: boolean,
  syncError: any,
  syncWarning: any,
  value: any[],
  props?: Object
}

type DefaultProps = {
  rerenderOnEveryChange: boolean
}

export type InstanceApi = {
  dirty: boolean,
  getRenderedComponent: { (): React$Component<*, *, *> },
  pristine: boolean,
  value: ?(any[])
} & React$Component<*, *, *>

const createConnectedFieldArray = (structure: Structure<*, *>) => {
  const { deepEqual, getIn, size } = structure
  const getSyncError = (syncErrors: Object, name: string) => {
    // For an array, the error can _ONLY_ be under _error.
    // This is why this getSyncError is not the same as the
    // one in Field.
    return plain.getIn(syncErrors, `${name}._error`)
  }

  const getSyncWarning = (syncWarnings: Object, name: string) => {
    // For an array, the warning can _ONLY_ be under _warning.
    // This is why this getSyncError is not the same as the
    // one in Field.
    return getIn(syncWarnings, `${name}._warning`)
  }

  class ConnectedFieldArray extends Component {
    props: Props
    static defaultProps: DefaultProps

    shouldComponentUpdate(nextProps: Props) {
      // Update if the elements of the value array was updated.
      const thisValue = this.props.value
      const nextValue = nextProps.value

      if (thisValue && nextValue) {
        if (
          thisValue.length !== nextValue.length ||
          (nextProps.rerenderOnEveryChange &&
            thisValue.some((val, index) => !deepEqual(val, nextValue[index])))
        ) {
          return true
        }
      }

      const nextPropsKeys = Object.keys(nextProps)
      const thisPropsKeys = Object.keys(this.props)
      return (
        nextPropsKeys.length !== thisPropsKeys.length ||
        nextPropsKeys.some(prop => {
          // useful to debug rerenders
          // if (!plain.deepEqual(this.props[ prop ], nextProps[ prop ])) {
          //   console.info(prop, 'changed', this.props[ prop ], '==>', nextProps[ prop ])
          // }
          return (
            !~propsToNotUpdateFor.indexOf(prop) &&
            !deepEqual(this.props[prop], nextProps[prop])
          )
        })
      )
    }

    get dirty(): boolean {
      return this.props.dirty
    }

    get pristine(): boolean {
      return this.props.pristine
    }

    get value(): any {
      return this.props.value
    }

    getRenderedComponent() {
      return this.refs.renderedComponent
    }

    getValue = (index: number): any =>
      this.props.value && getIn(this.props.value, String(index))

    render() {
      const {
        component,
        withRef,
        name,
        _reduxForm, // eslint-disable-line no-unused-vars
        validate, // eslint-disable-line no-unused-vars
        warn, // eslint-disable-line no-unused-vars
        rerenderOnEveryChange, // eslint-disable-line no-unused-vars
        ...rest
      } = this.props
      const props = createFieldArrayProps(
        structure,
        name,
        _reduxForm.form,
        _reduxForm.sectionPrefix,
        this.getValue,
        rest
      )
      if (withRef) {
        props.ref = 'renderedComponent'
      }
      return createElement(component, props)
    }
  }

  ConnectedFieldArray.propTypes = {
    component: PropTypes.oneOfType([PropTypes.func, PropTypes.string])
      .isRequired,
    props: PropTypes.object,
    rerenderOnEveryChange: PropTypes.bool
  }

  ConnectedFieldArray.defaultProps = {
    rerenderOnEveryChange: false
  }

  ConnectedFieldArray.contextTypes = {
    _reduxForm: PropTypes.object
  }

  const connector = connect(
    (state, ownProps) => {
      const { name, _reduxForm: { initialValues, getFormState } } = ownProps
      const formState = getFormState(state)
      const initial =
        getIn(formState, `initial.${name}`) ||
        (initialValues && getIn(initialValues, name))
      const value = getIn(formState, `values.${name}`)
      const submitting = getIn(formState, 'submitting')
      const syncError = getSyncError(getIn(formState, 'syncErrors'), name)
      const syncWarning = getSyncWarning(getIn(formState, 'syncWarnings'), name)
      const pristine = deepEqual(value, initial)
      return {
        asyncError: getIn(formState, `asyncErrors.${name}._error`),
        dirty: !pristine,
        pristine,
        state: getIn(formState, `fields.${name}`),
        submitError: getIn(formState, `submitErrors.${name}._error`),
        submitFailed: getIn(formState, 'submitFailed'),
        submitting,
        syncError,
        syncWarning,
        value,
        length: size(value)
      }
    },
    (dispatch, ownProps) => {
      const { name, _reduxForm } = ownProps
      const {
        arrayInsert,
        arrayMove,
        arrayPop,
        arrayPush,
        arrayRemove,
        arrayRemoveAll,
        arrayShift,
        arraySplice,
        arraySwap,
        arrayUnshift
      } = _reduxForm
      return mapValues(
        {
          arrayInsert,
          arrayMove,
          arrayPop,
          arrayPush,
          arrayRemove,
          arrayRemoveAll,
          arrayShift,
          arraySplice,
          arraySwap,
          arrayUnshift
        },
        actionCreator =>
          bindActionCreators(actionCreator.bind(null, name), dispatch)
      )
    },
    undefined,
    { withRef: true }
  )
  return connector(ConnectedFieldArray)
}

export default createConnectedFieldArray
