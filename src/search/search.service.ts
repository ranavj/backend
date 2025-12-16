import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  // 1. 👇 Post ko Elasticsearch mein daalo (Sync)
  async indexPost(post: any) {
    return this.elasticsearchService.index({
      index: 'posts', // Table ka naam
      body: {
        id: post._id.toString(),
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        createdAt: post.createdAt,
      },
    });
  }

  // 2. 👇 Magic Search Logic 🔍
  async search(text: string) {
    const response = await this.elasticsearchService.search({
      index: 'posts',
      body: {
        query: {
          multi_match: {
            query: text,
            fields: ['title', 'content'], // Title aur Content dono mein dhundo
            fuzziness: 'AUTO', // 👈 TYPO TOLERANCE (Magic) ✨
          },
        },
      } as any,
    });

    // Response Handling
    // Note: Agar Elastic Client v8+ hai toh 'response.hits' hota hai.
    // Agar v7 hai toh 'response.body.hits' hota hai.
    // Hum safe check lagayenge:
    const result = response as any; 
    const hits = result.hits ? result.hits.hits : result.body.hits.hits;
    return hits.map((hit: any) => hit._source);
  }
}