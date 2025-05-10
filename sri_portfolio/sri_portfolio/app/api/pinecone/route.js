import { NextResponse } from 'next/server';
import { 
  createPineconeIndex, 
  processAndUpsertFile, 
  semanticSearch, 
  clearNamespace, 
  deletePineconeIndex 
} from '../../utils/pinecone';

/**
 * Handle POST requests for Pinecone operations
 */
export async function POST(request) {
  try {
    const { action, params } = await request.json();
    
    switch (action) {
      case 'initialize':
        // Initialize Pinecone index
        await createPineconeIndex();
        return NextResponse.json({ success: true, message: 'Pinecone index initialized' });
      
      case 'upsert':
        if (!params.filePath) {
          return NextResponse.json({ success: false, error: "File path is required for upsert" }, { status: 400 });
        }
        const namespace = params.namespace || 'sri-s-knowledge-base';
        const count = await processAndUpsertFile(params.filePath, namespace);
        return NextResponse.json({ success: true, message: `Successfully upserted ${count} chunks from ${params.filePath} to namespace ${namespace}.` });
      
      case 'search':
        if (!params.query) {
          return NextResponse.json({ success: false, error: "Query is required for search" }, { status: 400 });
        }
        const searchNamespace = params.namespace || 'sri-s-knowledge-base';
        const topK = params.topK || 5;
        const results = await semanticSearch(params.query, searchNamespace, topK);
        
        // Format the results to make them easier to use in the frontend
        const formattedResults = results.map(hit => ({
          id: hit._id,
          score: hit._score,
          text: hit.fields?.chunk_text || '',
          category: hit.fields?.category || '',
          source: hit.fields?.source || ''
        }));
        
        return NextResponse.json({ 
          success: true, 
          results: formattedResults 
        });
      
      case 'clear':
        // Be very careful with this action
        // If namespace is not provided, it will use the default which might be unintended.
        // Consider adding a specific confirmation or making namespace mandatory.
        const clearNamespaceName = params?.namespace || 'sri-s-knowledge-base';
        await clearNamespace(clearNamespaceName);
        return NextResponse.json({ success: true, message: `Namespace '${clearNamespaceName}' cleared successfully.` });
      
      case 'delete':
        // Delete the Pinecone index
        await deletePineconeIndex();
        return NextResponse.json({ success: true, message: 'Deleted Pinecone index' });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in Pinecone API route:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 