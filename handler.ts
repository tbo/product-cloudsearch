const querystring = require('querystring');
const fetch = require('node-fetch');
const {stringify, parse} = require('qs');

const endpoint = 'search-rebelle-de-of2zvlq5mmhvlk7hnlmgoaxkn4.eu-central-1.cloudsearch.amazonaws.com';
const apiVersion = '2013-01-01';
const url = `http://${endpoint}/${apiVersion}/search?`;

const parseArray = field => (typeof field === 'string' && field.length) ? JSON.parse(field) : [];

const formatFields = (fields: string[]) =>
  fields
    .map(item => item.split(/[:|=]/))
    .map(([key, value]) => `${key}:'${value}'`);

const conjunctFilters = (filters: Array<string | string[]>) => {
  const disjunctive = filters.filter(item => Array.isArray(item)).map(formatFields).map(item => `(or ${item.join(' ')})`);
  const conjunctive = formatFields(filters.filter(item => !Array.isArray(item)) as string[]);
  const filterString = conjunctive.concat(disjunctive).join(' ');
  return filters.length < 2 ? filterString : `(and ${filterString})`;
}

const getOptions = ({query, facetFilters, numericFilters, hitsPerPage = 100, page = 0, facets}) => ({
  q: query,
  facetFilters: parseArray(facetFilters),
  numericFilters: parseArray(numericFilters),
  size: hitsPerPage,
  start: page * hitsPerPage,
  facets
});

const getQueryParams = ({facetFilters, numericFilters, facets, ...options}) => ({
  ...options,
  ...(facetFilters ? {fq: conjunctFilters(facetFilters.concat(numericFilters)), ...options} : {}),
  ...parseArray(facets).reduce((prev, facet) => ({...prev, [`facet.${facet}`]: '{}'}), {})
});

module.exports.search = ({queryStringParameters}, _, callback) => {
  const params = getQueryParams(getOptions(queryStringParameters));
  fetch(url + querystring.stringify(params))
    .then(result => result.text())
    .then(body => {
      callback(null, {statusCode: 200, body});
    });
};
