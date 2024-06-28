/* eslint-disable security/detect-object-injection */
import { handleTypedError } from './message';
import {
  achElementIds,
  cardElementIds,
  cashElementIds,
  ElementTypes,
  transactingWebComponentIds,
  webComponentIds,
  webComponentMap,
} from './data';
import PayTheoryHostedField from '../components/pay-theory-hosted-field';
import PayTheoryHostedFieldTransactional from '../components/pay-theory-hosted-field-transactional';
import { ErrorType } from './pay_theory_types';

export const findTransactingElement = (): PayTheoryHostedFieldTransactional | false => {
  let result: PayTheoryHostedFieldTransactional | false = false;
  transactingWebComponentIds.forEach(id => {
    const element = document.getElementsByName(id);
    if (element.length > 0) {
      const transactingElement = element[0];
      if (!isHidden(transactingElement)) {
        if (result === false) {
          result = transactingElement as PayTheoryHostedFieldTransactional;
        } else {
          handleTypedError(
            ErrorType.TRANSACTING_FIELD_ERROR,
            'There can only be one transacting element visible on the page.',
          );
          return false;
        }
      }
    }
  });
  return result;
};

export interface processedElement<
  T extends cashElementIds | cardElementIds | achElementIds,
  F extends PayTheoryHostedField | PayTheoryHostedFieldTransactional,
> {
  type: keyof T;
  frame: F;
  containerId: string;
}

export const addFrame = (frameType: webComponentIds, element: string) => {
  const tagFrame = document.createElement(frameType) as
    | PayTheoryHostedField
    | PayTheoryHostedFieldTransactional;
  tagFrame.setAttribute('id', `${element}-tag-frame`);
  tagFrame.setAttribute('name', frameType);
  return tagFrame;
};

const processContainer = <
  T extends cashElementIds | cardElementIds | achElementIds,
  F extends PayTheoryHostedField | PayTheoryHostedFieldTransactional,
>(
  elements: T,
  type: keyof T,
): processedElement<T, F> | string => {
  const contained = document.getElementById(`${elements[type] as string}-tag-frame`);
  if (contained === null) {
    const frameType = webComponentMap[type as ElementTypes];
    const frame = addFrame(frameType, elements[type] as string) as F;
    return { type, frame, containerId: elements[type] as string };
  } else {
    return `${elements[type]} is already mounted`;
  }
};

const findElementError = <T extends cashElementIds | cardElementIds | achElementIds>(
  elements: T,
  type: keyof T,
) => {
  const element = elements[type];
  return typeof element === 'undefined' ? `unknown type ${type as string}` : false;
};

export const processElements = <ET extends cashElementIds | cardElementIds | achElementIds>(
  elements: ET,
  fieldTypes: {
    transacting: (keyof ET)[];
    siblings: (keyof ET)[];
  },
) => {
  const processed: {
    transacting: processedElement<ET, PayTheoryHostedFieldTransactional>[];
    siblings: processedElement<ET, PayTheoryHostedField>[];
  } = {
    transacting: [],
    siblings: [],
  };

  let key: keyof typeof fieldTypes;
  for (key in fieldTypes) {
    fieldTypes[key].forEach(type => {
      let error = findElementError(elements, type);
      const container = document.getElementById(elements[type] as string);
      if (container && error === false) {
        const result = processContainer(elements, type);
        if (typeof result === 'string') {
          error = result;
        } else {
          //@ts-expect-error - result is not a string
          processed[key].push(result);
        }
      }
      if (error) {
        return handleTypedError(ErrorType.FIELD_ERROR, error);
      }
    });
  }
  return processed;
};

export const isHidden = (element: HTMLElement | undefined): boolean => {
  if (!element) return true;
  const style = window.getComputedStyle(element);
  if (style.display === 'none') {
    return true;
  } else if (element.parentElement) {
    return isHidden(element.parentElement);
  } else {
    return false;
  }
};
