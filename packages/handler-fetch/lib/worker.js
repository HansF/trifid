// @ts-check

import { parentPort } from 'node:worker_threads'
import { readFile } from 'node:fs/promises'
import { resolve as pathResolve } from 'node:path'

import oxigraph from 'oxigraph'

import { performOxigraphQuery } from './query.js'

/**
 * Fetch file content from URL or path.
 *
 * @param {string} url URL or path to file to fetch.
 * @returns {Promise<string>} File content.
 */
const getContent = async (url) => {
  let content

  if (url.startsWith('http://') || url.startsWith('https://')) {
    const response = await fetch(url)
    content = await response.text()
  } else {
    const resolvedPath = pathResolve(url)
    content = await readFile(resolvedPath, 'utf8')
  }

  return content
}

// Create a store
const store = new oxigraph.Store()
parentPort.postMessage({
  type: 'log',
  data: 'Created store',
})

// Handle configuration
const handleConfig = async (config) => {
  const { graphName, unionDefaultGraph, url, contentType, baseIri } = config
  let graphNameIri = graphName
  if ((typeof unionDefaultGraph === 'boolean' && unionDefaultGraph) || unionDefaultGraph === 'true') {
    graphNameIri = oxigraph.defaultGraph()
  }

  // Read data from file or URL
  const data = await getContent(url)
  parentPort.postMessage({
    type: 'log',
    data: `Loaded ${data.length} bytes of data from ${url}`,
  })
  // Load the data into the store
  store.load(data, {
    format: contentType,
    base_iri: baseIri,
    to_named_graph: graphNameIri,
  })
  parentPort.postMessage({
    type: 'log',
    data: 'Loaded data into store',
  })

  // Tell the parent that the worker is ready to handle queries
  parentPort.postMessage({
    type: 'ready',
    data: true,
  })
}

// Handle query
const handleQuery = async (data) => {
  const { query, queryId } = data
  let response = ''
  let contentType = 'text/plain'
  let success = false

  // Perform the query and catch any errors
  try {
    const { response: storeResponse, contentType: storeContentType } = await performOxigraphQuery(store, query)
    response = storeResponse
    contentType = storeContentType
    success = true
  } catch (error) {
    response = error.message
  }

  parentPort.postMessage({
    type: 'query',
    data: {
      queryId,
      response,
      contentType,
      success,
    },
  })
}

parentPort.on('message', async (event) => {
  if (!event || !event.type) {
    return
  }

  switch (event.type) {
    case 'config':
      await handleConfig(event.data)
      break
    case 'query':
      await handleQuery(event.data)
      break
  }
})
