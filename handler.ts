const querystring = require('querystring');
const fetch = require('node-fetch');
const {stringify, parse} = require('qs');

const endpoint = 'search-rebelle-de-of2zvlq5mmhvlk7hnlmgoaxkn4.eu-central-1.cloudsearch.amazonaws.com';
const apiVersion = '2013-01-01';
const url = `http://${endpoint}/${apiVersion}/search?`;

const parseArray = field => (typeof field === 'string' && field.length) ? JSON.parse(field) : [];

const conjunctFilters = (filters: string[]) => {
  const filterString = filters
    .map(item => item.split(':'))
    .map(([key, value]) => `${key}:'${value}'`)
    .join(' ');
  return filters.length < 2 ? filterString : `(and ${filterString})`;
}
const getOptions = ({query, facetFilters, hitsPerPage = 100, page = 0, facets, disjunctiveFacets}) => ({
  q: query,
  facetFilters: parseArray(facetFilters),
  size: hitsPerPage,
  start: page * hitsPerPage,
  facets,
  disjunctiveFacets: parseArray(disjunctiveFacets)
});

const getQueryParams = ({facetFilters, facets, ...options}) => ({
  ...options,
  ...(facetFilters ? {fq: conjunctFilters(facetFilters), ...options} : {}),
  ...parseArray(facets).reduce((prev, facet) => ({...prev, [`facet.${facet}`]: '{}'}), {})
});

module.exports.search = (event, _, callback) => {
  const params = getQueryParams(getOptions(event.queryStringParameters));
  fetch(url + querystring.stringify(params))
    .then(result => result.text())
    .then(body => {
      callback(null, {statusCode: 200, body});
    });
};
