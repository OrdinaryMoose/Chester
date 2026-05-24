export class DomainBootError extends Error {
  constructor(payload) {
    super(`DomainBootError[${payload.validator}/${payload.recordId}/${payload.field}]: ${payload.violation}`);
    this.name = 'DomainBootError';
    // Copy only the expected payload keys so a future caller that includes `name` or
    // `message` in their payload can't silently overwrite the error class identity or stack.
    this.validator = payload.validator;
    this.recordId = payload.recordId;
    this.field = payload.field;
    this.violation = payload.violation;
    this.expected = payload.expected;
    this.actual = payload.actual;
    this.isBootError = true;
  }
}

function check(cond, payload) { if (!cond) throw new DomainBootError(payload); }

/**
 * @param {Record<string, any>} specs OPERATION_SPECS
 * @param {object} tags imported tag module (provides CONSENT_SOURCES, ELEMENT_CATEGORIES)
 * @param {Set<string>} validPredicates Phase-A rule head predicates ∪ EDB predicates
 */
export function validateOperationSpecs(specs, tags, validPredicates) {
  const consentSources = new Set(Object.values(tags.CONSENT_SOURCES));
  const elementCategories = new Set(Object.values(tags.ELEMENT_CATEGORIES));
  for (const [verb, spec] of Object.entries(specs)) {
    for (const f of ['consentCategory', 'preconditions', 'idShape', 'translate', 'postconditions', 'clearsTwoYes', 'resultShape']) {
      check(f in spec, { validator: 'validateOperationSpecs', recordId: verb, field: f, violation: 'missing required field', expected: 'present', actual: 'missing' });
    }
    const cc = spec.consentCategory;
    if (Array.isArray(cc)) {
      for (const s of cc) {
        check(consentSources.has(s), { validator: 'validateOperationSpecs', recordId: verb, field: 'consentCategory[*]', violation: 'not in tags.CONSENT_SOURCES', expected: [...consentSources], actual: s });
      }
    } else {
      check(consentSources.has(cc), { validator: 'validateOperationSpecs', recordId: verb, field: 'consentCategory', violation: 'not in tags.CONSENT_SOURCES', expected: [...consentSources], actual: cc });
    }
    check(elementCategories.has(spec.idShape), { validator: 'validateOperationSpecs', recordId: verb, field: 'idShape', violation: 'not in tags.ELEMENT_CATEGORIES', expected: [...elementCategories], actual: spec.idShape });
    if ('customPostCheck' in spec) {
      check(typeof spec.customPostCheck === 'function' && spec.customPostCheck.length === 2,
        { validator: 'validateOperationSpecs', recordId: verb, field: 'customPostCheck', violation: 'not a function with arity 2', expected: 'function(args, readPorts)', actual: typeof spec.customPostCheck });
    }
    for (const block of ['preconditions', 'postconditions']) {
      check(Array.isArray(spec[block]),
        { validator: 'validateOperationSpecs', recordId: verb, field: block, violation: 'must be an array', expected: 'Array<QueryPattern>', actual: typeof spec[block] });
      for (const qp of spec[block]) {
        check(qp && typeof qp.predicate === 'string' && typeof qp.arity === 'number',
          { validator: 'validateOperationSpecs', recordId: verb, field: block, violation: 'QueryPattern shape invalid', expected: '{predicate: string, arity: number}', actual: JSON.stringify(qp) });
        check(validPredicates.has(qp.predicate),
          { validator: 'validateOperationSpecs', recordId: verb, field: `${block}.predicate`, violation: `predicate "${qp.predicate}" not in validPredicates`, expected: [...validPredicates], actual: qp.predicate });
      }
    }
  }
}

export function validateCategoryRegistry(registry, tags) {
  const consentSources = new Set(Object.values(tags.CONSENT_SOURCES));
  const elementCategories = new Set(Object.values(tags.ELEMENT_CATEGORIES));
  const renderSections = new Set(Object.values(tags.RENDER_SECTIONS));
  for (const [cat, desc] of Object.entries(registry)) {
    check(Array.isArray(desc.requiredFields) && desc.requiredFields.length > 0,
      { validator: 'validateCategoryRegistry', recordId: cat, field: 'requiredFields', violation: 'must be non-empty array', expected: 'non-empty', actual: desc.requiredFields });
    check(consentSources.has(desc.sourceConstraint),
      { validator: 'validateCategoryRegistry', recordId: cat, field: 'sourceConstraint', violation: 'not in tags.CONSENT_SOURCES', expected: [...consentSources], actual: desc.sourceConstraint });
    check(elementCategories.has(desc.idShape),
      { validator: 'validateCategoryRegistry', recordId: cat, field: 'idShape', violation: 'not in tags.ELEMENT_CATEGORIES', expected: [...elementCategories], actual: desc.idShape });
    check(renderSections.has(desc.renderSection),
      { validator: 'validateCategoryRegistry', recordId: cat, field: 'renderSection', violation: 'not in tags.RENDER_SECTIONS', expected: [...renderSections], actual: desc.renderSection });
  }
}

export function validateRuleTemplates(templates, registry) {
  const knownCategories = new Set(Object.keys(registry));
  for (const [templateKey, template] of Object.entries(templates)) {
    check(knownCategories.has(template.elementCategory),
      { validator: 'validateRuleTemplates', recordId: templateKey, field: 'elementCategory', violation: 'not in CATEGORY_REGISTRY keys', expected: [...knownCategories], actual: template.elementCategory });
    check(typeof template.build === 'function',
      { validator: 'validateRuleTemplates', recordId: templateKey, field: 'build', violation: 'must be a function', expected: 'function(elementId)', actual: typeof template.build });
  }
}
