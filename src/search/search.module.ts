import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { SearchService } from './search.service';

@Module({
  imports: [
    ElasticsearchModule.register({
      node: 'http://elasticsearch:9200', // Docker Container Address
    }),
  ],
  providers: [SearchService],
  exports: [SearchService], // 👈 Export kiya taaki PostsModule use kar sake
})
export class SearchModule {}