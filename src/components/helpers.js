import { utils, writeFile } from 'xlsx';
import moment from 'moment';
const headerTranslate = {
  projects: {
    "Project ID": "CPId",
    "Project Name": "name",
    "Category": "category",
    "Non-billable": "nonBillable",
  },
  employees: {
    "Employee": "emId",
    "Group Member": "group",
  },
  projectsPeriod: {
    "Client/Project: Project Name": "name",
    "Client/Project: ID": "CPId",
    "Name": "emId",
    "Name": "emId",
    "Service Item: Display Name": "serviceItem",
    "Duration": "duration"   
  }
}

const findHeader = matrix => {
  const res = {
    dataType: null,
    dataLine: -1
  }
  for (let line = 0; line < matrix.length; line++) {
    const row = matrix[line]
    const headerTypes = Object.keys(headerTranslate)
    const dataTypeFound = headerTypes.find(headerType => {
      const headerKeys = Object.keys(headerTranslate[headerType])
        .filter(s => s !== 'Service Item: Display Name') /** case  old */
      return headerKeys.every(h => row.includes(h))
    })
    if (dataTypeFound) {
      res.dataType = dataTypeFound
      res.dataLine = line + 1
      break
    }
  }
  return res
}

const parseExcel = (Sheets) => {
  const errorMessage = []
  const successMessage = []
  const res = {}
  for (const sheetKey in Sheets) {
    const matrix = utils.sheet_to_json(Sheets[sheetKey], { header:1, raw:true, cellDates:true })
    const { dataType, dataLine } = findHeader(matrix)
    if (dataType === 'projects') {
      const { data, missingIds } = parseSheetProject(matrix, dataLine)
      res[dataType] = data
      successMessage.push(`${sheetKey}->${Object.keys(data).length} (${dataType}s)`)
      errorMessage.push(`Project missing ID: ${missingIds.join(', ')}`)
    } else if (dataType === 'employees') {
      const { data } = parseSheetGroup(matrix, dataLine)
      res[dataType] = data
      successMessage.push(`${sheetKey}->${Object.keys(data).length} (${dataType}s)`)
    } else if (dataType === 'projectsPeriod') {
      const { data, projects } = parseSheetReport(matrix, dataLine)
      res[dataType] = data
      res.projects = projects
      successMessage.push(`${sheetKey}->${Object.keys(data).length} (${dataType}s)`)
    }
    if (!dataType) {
      errorMessage.push(`cant parse sheet: ${sheetKey}`)
    }
  }
  console.log({ errorMessage, successMessage, data: res }, 'parseExcel')
  return { errorMessage, successMessage, data: res }
}

const parseSheetProject = (matrix, line = 0) => {
  const missingIds = []
  const res = {}
  for (; line < matrix.length; line++) {
    let [CPId, name, category, nonBillable] = matrix[line]
    CPId = CPId?.toString()?.trim() || ''
    name = name?.toString()?.trim() || ''
    category = category?.toString()?.trim() || ''
    nonBillable = nonBillable?.toString()?.trim() || ''
    if (CPId) {
      res[CPId] = { CPId: CPId, name: name, category: category, nonBillable: nonBillable }
    } else missingIds.push(name)
  }
  return {
    data: res,
    missingIds: missingIds
  }
}

const parseSheetGroup = (matrix, line = 0) => {
  const missingIds = []
  const res = {}
  for (; line < matrix.length; line++) {
    const [emId, group, role] = matrix[line]
    if (emId) {
      res[emId] = { emId, group, role }
    }
  }
  return {
    data: res
  }
}

const getTimeRange = (textTimeRange = "" /** February 19, 2023 - February 25, 2023 */) => {
  const regexTime = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\s+-\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i
  if (regexTime.test(textTimeRange)) {
    const [startDate, endDate] = textTimeRange.split('-').map(textTime => {
     return moment(textTime.trim(), 'MMMM D, YYYY').format('YYYY-MM-DD')
    })
    return { startDate, endDate }
  }
  return false
}

const parseSheetReport = (matrix, line = 0) => {
  const res = {}
  const projectsPeriodObject = {}
  const projects = {}
  let currentProjectName
  let dateRange
  for (const row of matrix) {
   if (!dateRange) {
    row.forEach(cell => {
      const timeObject = getTimeRange(cell)
      if (timeObject) {
        dateRange = timeObject
      }
    })
   } else break
  }

  const labelFields = matrix[line - 1]
  for (; line < matrix.length; line++) {
    const row = matrix[line]
    let name, CPId, emId, serviceItem, durationText
    if (labelFields.includes('Service Item: Display Name')) {
      [name, CPId, emId, serviceItem, durationText] = row
    } else {
      [name, CPId, emId, durationText] = row
    }

    name = name?.toString()?.trim() || ''
    CPId = CPId?.toString()?.trim() || ''
    emId = emId?.toString()?.trim() || ''
    serviceItem = serviceItem?.toString()?.trim() || ''
    durationText = durationText?.toString()?.trim()
    const duration = Number.isNaN(Number(durationText)) ? 0 : Number(durationText)
    if (name) {
      currentProjectName = name
    }
    const isTrackDuration = currentProjectName && CPId && emId && durationText
    if (isTrackDuration) {
      if (!projectsPeriodObject[CPId]) {
        projectsPeriodObject[CPId] = { CPId, ...dateRange, data: {} }
      }
      const oldDuration = projectsPeriodObject?.[CPId]?.data?.[emId]?.duration || 0
      const oldServiceItem = projectsPeriodObject?.[CPId]?.data?.[emId]?.serviceItem
      projectsPeriodObject[CPId].data[emId] = {
        duration: duration + oldDuration,
        serviceItem: serviceItem || oldServiceItem,
      }
      projects[CPId] = { CPId, name: currentProjectName }
    }
  }
  return {
    data: Object.keys(projectsPeriodObject).map(CPId => projectsPeriodObject[CPId]), // array
    projects,
  }
}

const parseJson = j => {
  try {
    const pj = JSON.parse(j)
    if (typeof pj === 'object') {
      return pj
    }
  } catch (error) {}
  return j
}

const formatDateRange = (dateRange, opt) => {
  if (dateRange.includes(':')) {
    const [startDate, endDate] = dateRange.split(':')
    const formattedStartDate = moment(startDate, 'YYYY-MM-DD').format('MMMM D, YYYY')
    const formattedEndDate = moment(endDate, 'YYYY-MM-DD').format('MMMM D, YYYY')
    return `${formattedStartDate} - ${formattedEndDate}`
  } else {
    if (opt?.format === 'YYYY-MM-DD') {
      return moment(dateRange, opt?.format).format('MMMM D, YYYY')
    } else if (opt?.format === 'YYYY-MM') {
      return moment(dateRange, opt?.format).format('MMMM YYYY')
    } else if (opt?.format === 'YYYY') {
      return dateRange
    }
  }
}

const genMatrixRTByProject = ({ project, items, employeesOb }, viewOption) => {
  const gStartDate = items[0].startDate
  const gEndDate = items[items.length - 1].endDate
  const matrixProject = [
    ["Project ID", project?.CPId],
    ["Project Name", project?.name],
    ["Category", project?.category],
    ["Non-billable", project?.nonBillable],
    ["Time Range", formatDateRange(`${gStartDate}:${gEndDate}`)],
  ]
  const timePeriods = {}
  for (const item of items) {
    const timePeriod = moment(item?.startDate).format(viewOption?.group)
    timePeriods[timePeriod] = true
  }

  // header
  const headers = [
    { label: 'Team Member', key: 'emId' },
    ...Object.keys(timePeriods)
      .map(timePeriod => ({ label: formatDateRange(timePeriod, { format: viewOption?.group }), key: `period:${timePeriod}` })),
    { label: 'Total', key: 'total' },
    { label: 'Non-Service Item', key: 'nonServiceItemSummary' },
  ]
  const matrixRT = [headers.map(h => h.label)]

  // rows value
  const serviceItemDurationSummary = {}
  const updateValue = (object, key, value) => {
    if (typeof object[key] === 'undefined') {
      object[key] = 0
    }
    object[key] += value
  }
  const roleDurationSummary = {}
  const nonServiceItemSummary = {}
  const calcTotalColumns = {}
  const emIds = Object.keys(employeesOb).sort()
  for (const emId of emIds) {
    const emRole = employeesOb?.[emId]?.role || emId
    const employeeRow = []
    let calcTotalRow = 0
    for (const header of headers) {
      if (header.key === 'emId') {
        employeeRow.push(emId)
      } else if (header.key === 'total') {
        employeeRow.push(calcTotalRow)
        updateValue(calcTotalColumns, header.key, calcTotalRow)
      } else if (header.key === 'nonServiceItemSummary') {
        employeeRow.push(nonServiceItemSummary[emId])
        updateValue(calcTotalColumns, header.key, nonServiceItemSummary[emId])
      } else if (/^period:/gm.test(header.key)){
        const itemPeriod = items.find(item => moment(item?.startDate).format(viewOption?.group) === header.key.replace('period:', ''))
        const serviceItem = itemPeriod?.data?.[emId]?.serviceItem
        const timeUsed = Number(itemPeriod?.data?.[emId]?.duration) || 0
        employeeRow.push(timeUsed)
        calcTotalRow += timeUsed
        updateValue(calcTotalColumns, header.key, timeUsed)
        if (serviceItem) {
          updateValue(serviceItemDurationSummary, serviceItem, timeUsed)
          updateValue(nonServiceItemSummary, emId, 0)
        } else {
          updateValue(nonServiceItemSummary, emId, timeUsed)
        }
      }
    }
    updateValue(roleDurationSummary, emRole, calcTotalRow)
    matrixRT.push(employeeRow)
  }

  // rows total
  const totalRow = []
  for (const header of headers) {
    if (header.key === 'emId') {
      totalRow.push('TOTAL')
    } else if (/^period:/gm.test(header.key)){
      totalRow.push(calcTotalColumns[header.key])
    } else if (header.key === 'total') {
      totalRow.push(calcTotalColumns[header.key])
    } else if (header.key === 'nonServiceItemSummary') {
      totalRow.push(calcTotalColumns[header.key])
    }
  }
  matrixRT.push(totalRow)

  // matrix roleDurationSummary
  console.log('roleDurationSummary', roleDurationSummary)
  const roles = Object.keys(roleDurationSummary).sort()
  const roDurSumRow = [['Role', 'Hours']]
  for (const role of roles) {
    roDurSumRow.push([ role, roleDurationSummary[role] ])
  }

  // matrix serviceItemDurationSummary
  console.log('serviceItemDurationSummary', serviceItemDurationSummary)
  const serviceItems = Object.keys(serviceItemDurationSummary).sort()
  const serItSumRow = [['Service Item', 'Hours']]
  for (const serviceItem of serviceItems) {
    serItSumRow.push([ serviceItem, serviceItemDurationSummary[serviceItem] ])
  }

  const rowPS = []
  for (let y = 0;;y++) {
    let xP = 0
    let xR = 3
    let xS = 6

    const rowSlot = []
    const rowP = matrixProject[y] || []
    const rowR = roDurSumRow[y] || []
    const rowS = serItSumRow[y] || []

    if (!rowP.length && !rowR.length && !rowS.length) break

    for (const item of rowP) {
      rowSlot[xP++] = item
    }
    for (const item of rowR) {
      rowSlot[xR++] = item
    }
    for (const item of rowS) {
      rowSlot[xS++] = item
    }
    rowPS.push(rowSlot)
  }
  // // mix matrixProject
  // const maxRowLength = roDurSumRow.length > matrixProject.length  ? roDurSumRow.length : matrixProject.length
  // const rowPS = [], paddingS = ['']
  // for (let i = 0; i < maxRowLength; i++) {
  //   const rowPSi = []
  //   const rowP0 = matrixProject?.[0]?.map(() => '') || []
  //   const rowPi = matrixProject[i]
  //   const rowS0 = roDurSumRow?.[0]?.map(() => '') || []
  //   const rowSi = roDurSumRow[i]

  //   if (rowPi) rowPSi.push(...rowPi, ...paddingS)
  //   else rowPSi.push(...rowP0, ...paddingS)

  //   if (rowSi) rowPSi.push(...rowSi)
  //   else rowPSi.push(...rowS0)
  //   rowPS.push(rowPSi)
  // }

  return [
    ...rowPS, [''],
    ...matrixRT, [''],
  ]
}

const formatRTByProject = ({ project, items, employeesOb }, viewOption) => {
  if (!viewOption) throw new Error ('Missing viewOption')
  // step1: sort startDate
  const dataPeriod = items.sort((p1, p2) => {
    if (p1.startDate < p2.startDate) return -1
    if (p1.startDate === p2.startDate) return 0
    if (p1.startDate > p2.startDate) return 1
  })
  // step2: group date follow viewOption
  const dataPeriodGrouped = []
  const parseNum = s => isNaN(Number(s)) ? 0 : Number(s)
  const getGroupId = (CPId, startDate) => `${CPId}-${moment(startDate).format(viewOption?.group)}`
  for (const item of dataPeriod) {
    const group = dataPeriodGrouped.find(g => getGroupId(g.CPId, g.startDate) === getGroupId(item.CPId, item.startDate))
    if (!group) {
      dataPeriodGrouped.push(item)
    } else {
      for (const iEmId in item.data) {
        const iDuration = parseNum(item?.data?.[iEmId]?.duration)
        const gDuration = parseNum(group?.data?.[iEmId]?.duration)
        const serviceItem = group?.data?.[iEmId]?.serviceItem || item?.data?.[iEmId]?.serviceItem
        group.data[iEmId] = {
          duration: iDuration + gDuration,
          serviceItem
        }
      }
      group.endDate = item.endDate
    }
  }
  return genMatrixRTByProject({ project, items: dataPeriodGrouped, employeesOb }, viewOption)
}

const generateReportTimeBoard = (projectsOb, employeesOb, dataPeriodArr, viewOption) => {
  const gProject = {}
  for (const item of dataPeriodArr) {
    if (!gProject[item.CPId]) {
      gProject[item.CPId] = {
        project: projectsOb[item.CPId],
        items: [],
        employeesOb: {}
      }
    }
    gProject[item.CPId].items.push(item)
    for (const emId in item.data) {
      gProject[item.CPId].employeesOb[emId] = employeesOb[emId]
    }
  }

  const matrix = []
  const gCPIds = Object.keys(gProject).sort()
  for (const CPId of gCPIds) {
    const gProjectMatrix = formatRTByProject(gProject[CPId], viewOption)
    const paddingTop = matrix.length ? [[''], ['']] : []
    matrix.push(...paddingTop, ...gProjectMatrix)
  }

  const worksheet = utils.aoa_to_sheet(matrix)
  const html = utils.sheet_to_html(worksheet)
  return { html, matrix }
}

const downloadExcelReport = (matrix, opt) => {
  const sheetName = opt?.sheetName || 'report-time'
  const excelFileName= opt?.excelFileName || 'report-time.xlsx'
  const workbook = utils.book_new()
  const worksheet = utils.aoa_to_sheet(matrix)
  utils.book_append_sheet(workbook, worksheet, sheetName)
  writeFile(workbook, excelFileName, { compression: true })
}

export {
  headerTranslate,
  parseExcel,
  parseJson,
  generateReportTimeBoard,
  downloadExcelReport
}