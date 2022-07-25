/**
 * True if the value is prefixed with N underscores followed by a single dot
 *
 * ex: _____.abc
 *
 * ex: _.SignIn.formData.password
 *
 * @param v Reference string
 * @returns { boolean }
 */

export default function isTraverseReference(v = '') {
	return /^[_]+\./.test(v)
}
