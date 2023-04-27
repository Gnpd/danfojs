/**
*  @license
* Copyright 2022 JsData. All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.

* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* ==========================================================================
*/
import {
    ArrayType1D,
    ArrayType2D,
    JsonInputOptionsBrowser,
    JsonOutputOptionsBrowser
} from '../../shared/types'
import { DataFrame, NDframe, Series } from '../../'

/**
 * Reads a JSON file from local or remote location into a DataFrame.
 * @param fileName URL or local file path to JSON file.
 * @param options Configuration object. Supported options:
 * - `method`: The HTTP method to use. Defaults to `'GET'`.
 * - `headers`: Additional headers to send with the request. Supports the `node-fetch` [HeadersInit]
 * @example
 * ```
 * import { readJSON } from "danfojs-node"
 * const df = await readJSON("https://raw.githubusercontent.com/test.json")
 * ```
 * @example
 * ```
 * import { readJSON } from "danfojs-node"
 * const df = await readJSON("https://raw.githubusercontent.com/test.json", {
 *    headers: {
 *      Accept: "text/json",
 *      Authorization: "Bearer YWRtaW46YWRtaW4="
 *    }
 * })
 * ```
 * @example
 * ```
 * import { readJSON } from "danfojs-node"
 * const df = await readJSON("./data/sample.json")
 * ```
 */
const $readJSON = async (file: any, options?: JsonInputOptionsBrowser) => {
    const { method, headers, frameConfig } = { method: "GET", headers: {}, frameConfig: {}, ...options }

    if (typeof file === "string" && file.startsWith("http")) {

        return new Promise(resolve => {
            fetch(file, { method, headers }).then(response => {
                if (response.status !== 200) {
                    throw new Error(`Failed to load ${file}`)
                }
                response.json().then(json => {
                    resolve(new DataFrame(json, frameConfig));
                });
            }).catch((err) => {
                throw new Error(err)
            })
        })

    } else if (file instanceof File) {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = (event) => {
                const jsonObj = JSON.parse(event?.target?.result as string);
                resolve(new DataFrame(jsonObj, frameConfig));
            }
        })
    } else {
        throw new Error("ParamError: File not supported. file must be a url or an input File object")
    }
};


/**
 * Converts a DataFrame or Series to JSON. 
 * @param df DataFrame or Series to be converted to JSON.
 * @param options Configuration object. Supported options:
 * - `fileName`: The file path to write the JSON to. If not specified, the JSON object is returned.
 * - `format`: The format of the JSON. Defaults to `'column'`. E.g for using `column` format:
 * ```
 * [{ "a": 1, "b": 2, "c": 3, "d": 4 },
 *  { "a": 5, "b": 6, "c": 7, "d": 8 }]
 * ```
 * and `row` format:
 * ```
 * { "a": [1, 5, 9],
 *  "b": [2, 6, 10]
 * }
 * ```
 * @example
 * ```
 * import { toJSON } from "danfojs-node"
 * const df = new DataFrame([[1, 2, 3], [4, 5, 6]])
 * const json = toJSON(df)
 * ```
 * @example
 * ```
 * import { toJSON } from "danfojs-node"
 * const df = new DataFrame([[1, 2, 3], [4, 5, 6]])
 * toJSON(df, {
 *     fileName: "./data/sample.json",
 *     format: "row"
 *   })
 * ```
 */
const $toJSON = (df: NDframe | DataFrame | Series, options?: JsonOutputOptionsBrowser): object | void => {
    let { fileName, format, download } = { fileName: "output.json", download: false, format: "column", ...options }

    if (df.$isSeries) {
        const obj: { [key: string]: ArrayType1D } = {};
        obj[df.columns[0]] = df.values as ArrayType1D;

        if (download) {
            if (!fileName.endsWith(".json")) {
                fileName = fileName + ".json"
            }
            $downloadFileInBrowser(obj, fileName)
        } else {
            return obj
        }

    } else {
        if (format === "row") {
            const obj: { [key: string]: ArrayType1D } = {};
            for (let i = 0; i < df.columns.length; i++) {
                obj[df.columns[i]] = (df as DataFrame).column(df.columns[i]).values as ArrayType1D;
            }
            if (download) {
                if (!(fileName.endsWith(".json"))) {
                    fileName = fileName + ".json"
                }

                $downloadFileInBrowser(obj, fileName)
            } else {
                return obj
            }
        } else {
            const values = df.values as ArrayType2D
            const header = df.columns
            const jsonArr: any = [];

            values.forEach((val) => {
                const obj: any = {};
                header.forEach((h, i) => {
                    obj[h] = val[i]
                });
                jsonArr.push(obj);
            });
            if (download) {
                if (!fileName.endsWith(".json")) {
                    fileName = fileName + ".json"
                }
                $downloadFileInBrowser(jsonArr, fileName)
            } else {
                return jsonArr
            }
        }
    }
};

/**
 * Internal function to download a JSON file in the browser.
 * @param content A string of JSON file contents
 * @param fileName  The name of the file to be downloaded
 */
const $downloadFileInBrowser = (content: any, fileName: string) => {
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(content));
    hiddenElement.target = '_blank';
    hiddenElement.download = fileName;
    hiddenElement.click();
}


export {
    $readJSON,
    $toJSON
}