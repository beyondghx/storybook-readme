import PropTypes from 'prop-types';
import React from 'react';

const PropTypesMap = new Map();

Object.keys(PropTypes).forEach(typeName => {
  const type = PropTypes[typeName];

  PropTypesMap.set(type, typeName);
  PropTypesMap.set(type.isRequired, typeName);
});

const isNotEmpty = obj => obj && obj.props && Object.keys(obj.props).length > 0;

const hasDocgen = type => isNotEmpty(type.__docgenInfo);

const propsParser = (docgenInfoProp = {}) => {
  if (docgenInfoProp.flowType) return docgenInfoProp.flowType
  if (docgenInfoProp.type) {
    let { name, value } = docgenInfoProp.type
    if (typeof value === 'object') value = 'object' // resolve typeof object
    return `${name}${value ? ': ' + value : ''}`
  }
  return 'other'
}

const defaultValParser = defaultVal => {
  // resolve defaultValue like "{\n  a: true,\n  b: true\n}"
  if (defaultVal.value) return defaultVal.value.replace(/\n/ig, '')
}

const descriptionParser = description => {
  // resolve description with new line
  if (description) return description.replace(/\n/ig, ' ')
}

const propsFromDocgen = type => {
  const props = {};
  const docgenInfoProps = type.__docgenInfo.props;

  Object.keys(docgenInfoProps).forEach(property => {
    const docgenInfoProp = docgenInfoProps[property];
    const defaultValueDesc = docgenInfoProp.defaultValue || {};
    const propType = propsParser(docgenInfoProp);
    const defaultValue = defaultValParser(defaultValueDesc);
    const description = descriptionParser(docgenInfoProp.description);

    props[property] = {
      property,
      propType,
      required: docgenInfoProp.required,
      description: description,
      defaultValue: defaultValue,
    };
  });

  return props;
};

const propsFromPropTypes = type => {
  const props = {};

  if (type.propTypes) {
    Object.keys(type.propTypes).forEach(property => {
      const typeInfo = type.propTypes[property];
      const required = typeInfo.isRequired === undefined;
      const docgenInfo =
        type.__docgenInfo &&
        type.__docgenInfo.props &&
        type.__docgenInfo.props[property];
      const description = docgenInfo ? docgenInfo.description : null;
      let propType = PropTypesMap.get(typeInfo) || 'other';

      if (propType === 'other') {
        if (docgenInfo && docgenInfo.type) {
          propType = docgenInfo.type.name;
        }
      }

      props[property] = { property, propType, required, description };
    });
  }

  if (type.defaultProps) {
    Object.keys(type.defaultProps).forEach(property => {
      const value = type.defaultProps[property];

      if (value === undefined) {
        return;
      }

      if (!props[property]) {
        props[property] = { property };
      }

      props[property].defaultValue = value;
    });
  }

  return props;
};

export default function parseProps(type) {
  if (!type) {
    return null;
  }

  const propDefinitionsMap = hasDocgen(type)
    ? propsFromDocgen(type)
    : propsFromPropTypes(type);

  return Object.values(propDefinitionsMap);
}
