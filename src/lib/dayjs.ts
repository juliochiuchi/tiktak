import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import localizedFormat from "dayjs/plugin/localizedFormat"
import customParseFormat from "dayjs/plugin/customParseFormat"
import "dayjs/locale/pt-br"

dayjs.extend(duration)
dayjs.extend(localizedFormat)
dayjs.extend(customParseFormat)
dayjs.locale("pt-br")

export { dayjs }
