/** @typedef {{ podr: number, median: number, weight: number }} Rank */
/**
 * Recommended ranks (https://web.dev/metrics/):
 *
 * FCP: Fast < 1 second,   Slow > 3s,    WEIGHT: 15%
 * LCP: Fast < 2.5 second, Slow > 4s,    WEIGHT: 35%
 * FID: Fast < 100 ms,     Slow > 300ms, WEIGHT: 30%
 * CLS: Fast < 0.1,        Slow > 0.25,  WEIGHT: 20%
 *
 * `podr` value is calibrated to return 0.9 for the fast value,
 * `median` value returns 0.5.
 * as Lighthouse does: https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/audits/metrics/largest-contentful-paint.js#L45
 *
 * @type {Object<string,Rank>}
 */

const defaultRanks = {
  fcp: { podr: 400 /* 1000 => 90 */, median: 3000, weight: 25 },
  lcp: { podr: 2250 /* 2500 => 90 */, median: 4000, weight: 40 },
  fid: { podr: 40 /* 100 => 90 */, median: 300, weight: 20 },
  cls: { podr: 0.055 /* 0.1 => 90 */, median: 0.25, weight: 15 },
}

/**
 * Calc Lighthouse-like speed score, based on 4 RUM metrics.
 *
 * Test any metric:
 * node -r esm -e "console.log(require('./src/experimental/score').calcSpeedScore({ ttfb: 300 }, { ttfb: { podr: 300, median: 1000, weight: 1 } }))"
 *
 * @param {{ fcp: number, lcp?: number, fid?: number, cls?: number }} values
 * @param {{ fcp?: Rank, lcp?: Rank, fid?: Rank, cls?: Rank }} ranks
 */

export function calcSpeedScore(values, ranks = {}) {
  if (!values || Object.keys(values).length === 0) throw new Error('Provide values')
  const items = Object.keys(values).map((metric) => {
    const value = values[metric]
    const rank = ranks[metric] || defaultRanks[metric]
    if (!rank) throw new Error(`Invalid metric: ${metric}`)
    const score = computeLogNormalScore(value, rank.podr, rank.median)
    return { score, weight: rank.weight }
  })
  return arithmeticMean(items)
}

/** ____ COPIED FROM LIGHTHOUSE: https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/audits/audit.js#L80 ____ */

/**
 * Computes a clamped score between 0 and 1 based on the measured value. Score is determined by
 * considering a log-normal distribution governed by the two control points, point of diminishing
 * returns and the median value, and returning the percentage of sites that have higher value.
 *
 * @param {number} measuredValue
 * @param {number} diminishingReturnsValue
 * @param {number} medianValue
 */

function computeLogNormalScore(measuredValue, diminishingReturnsValue, medianValue) {
  const distribution = getLogNormalDistribution(medianValue, diminishingReturnsValue)
  let score = distribution.computeComplementaryPercentile(measuredValue)
  score = Math.min(1, score)
  score = Math.max(0, score)
  return clampTo2Decimals(score)
}

/**
 * Creates a log-normal distribution à la traceviewer's statistics package.
 * Specified by providing the median value, at which the score will be 0.5,
 * and the falloff, the initial point of diminishing returns where any
 * improvement in value will yield increasingly smaller gains in score. Both
 * values should be in the same units (e.g. milliseconds). See
 *   https://www.desmos.com/calculator/tx1wcjk8ch
 * for an interactive view of the relationship between these parameters and
 * the typical parameterization (location and shape) of the log-normal
 * distribution.
 * @param {number} median
 * @param {number} falloff
 */

function getLogNormalDistribution(median, falloff) {
  const location = Math.log(median)

  // The "falloff" value specified the location of the smaller of the positive
  // roots of the third derivative of the log-normal CDF. Calculate the shape
  // parameter in terms of that value and the median.
  const logRatio = Math.log(falloff / median)
  const shape = Math.sqrt(1 - 3 * logRatio - Math.sqrt((logRatio - 3) * (logRatio - 3) - 8)) / 2

  return {
    computeComplementaryPercentile(x) {
      const standardizedX = (Math.log(x) - location) / (Math.SQRT2 * shape)
      return (1 - erf(standardizedX)) / 2
    },
  }
}

/**
 * Approximates the Gauss error function, the probability that a random variable
 * from the standard normal distribution lies within [-x, x]. Moved from
 * traceviewer.b.math.erf, based on Abramowitz and Stegun, formula 7.1.26.
 * @param {number} x
 */

function erf(x) {
  // erf(-x) = -erf(x);
  const sign = Math.sign(x)
  x = Math.abs(x)

  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const t = 1 / (1 + p * x)
  const y = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))))
  return sign * (1 - y * Math.exp(-x * x))
}

/**
 * Clamp figure to 2 decimal places.
 *
 * @param {number} val
 */

function clampTo2Decimals(val) {
  return Math.round(val * 100) / 100
}

/**
 * Computes the weighted-average of the score of the list of items,
 * attps://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/scoring.js#L24
 *
 * @param {{score: number|null, weight: number}[]} items
 */

function arithmeticMean(items) {
  // Filter down to just the items with a weight as they have no effect on score
  items = items.filter((item) => item.weight > 0)
  // If there is 1 null score, return a null average
  if (items.some((item) => item.score === null)) return null

  const results = items.reduce(
    (result, item) => {
      const score = item.score
      const weight = item.weight

      return {
        weight: result.weight + weight,
        sum: result.sum + /** @type {number} */ (score) * weight,
      }
    },
    { weight: 0, sum: 0 }
  )

  return clampTo2Decimals(results.sum / results.weight || 0)
}
