import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Eye, Calendar } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { searchService } from '../services/search.service';
import { formatDate, getStatusColor, getStatusLabel } from '../lib/utils';

interface SearchResultItem {
  id: number;
  date: string;
  status?: string;
  [key: string]: any;
}

const moduleMappings: Record<string, { label: string; path: string; bg: string; text: string }> = {
  tank_records: {
    label: 'Tank Records',
    path: '/tank-records',
    bg: 'bg-primary-50 dark:bg-primary-950/30',
    text: 'text-primary-700 dark:text-primary-400',
  },
  final_product_storage_records: {
    label: 'Final Product Storage',
    path: '/final-product-storage',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    text: 'text-indigo-700 dark:text-indigo-400',
  },
  bi_product_reports: {
    label: 'Final Bi-Product Reports',
    path: '/final-bi-product',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-400',
  },
  raw_bulk_milk_testing_records: {
    label: 'Raw Bulk Milk Testing',
    path: '/raw-bulk-milk',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    text: 'text-teal-700 dark:text-teal-400',
  },
  packing_milk_reports: {
    label: 'Packing Milk Reports',
    path: '/packing-milk-report',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    text: 'text-cyan-700 dark:text-cyan-400',
  },
  milk_taken_report_bi_products: {
    label: 'Milk Taken (Bi-Product)',
    path: '/milk-taken-report-bi-product',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
  },
  buttermilk_analysis_records: {
    label: 'Buttermilk Analysis Records',
    path: '/buttermilk-analysis-record',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  pouch_weighing_sessions: {
    label: 'Pouch Weighing Log Sessions',
    path: '/pouch-weighing-log',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
  },
};

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  const { data: searchResponse, isLoading } = useQuery({
    queryKey: ['globalSearch', query],
    queryFn: () => searchService.globalSearch(query),
    enabled: !!query.trim(),
  });

  const results: Record<string, SearchResultItem[]> = searchResponse?.data || {};

  const totalResultsCount = Object.values(results).reduce(
    (acc, items) => acc + (items?.length || 0),
    0
  );

  const getSummaryText = (moduleKey: string, item: SearchResultItem) => {
    switch (moduleKey) {
      case 'tank_records':
        return `Tank No: ${item.tank_number || '—'} | Batch No: ${item.batch_number || '—'} | Qty: ${item.milk_quantity} L`;
      case 'final_product_storage_records':
        return `Tank No: ${item.tank_no || '—'} | Milk Type: ${item.type_of_milk || '—'} | Qty: ${item.milk_quantity_l} L`;
      case 'bi_product_reports':
        return `Product: ${item.product_name || '—'} | Batch No: ${item.batch_no || '—'}`;
      case 'raw_bulk_milk_testing_records':
        return `Sample: ${item.sample_name || '—'} | Type: ${item.type_of_milk || '—'}`;
      case 'packing_milk_reports':
        return `Product: ${item.product_name || '—'} | Tank No: ${item.tank_no || '—'} | Batch No: ${item.batch_no || '—'}`;
      case 'milk_taken_report_bi_products':
        return `Product: ${item.product_name || '—'} | FAT: ${item.fat_percent}% | SNF: ${item.snf_percent}%`;
      case 'buttermilk_analysis_records':
        return `Sample Type: ${item.type_of_sample || '—'} | Batch No: ${item.batch_no || '—'}`;
      case 'pouch_weighing_sessions':
        return `Supervisor: ${item.packing_supervisor_name || '—'} | Incharge: ${item.quality_incharge_name || '—'}`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
          <Search className="w-8 h-8 text-primary-600" />
          Global Search Results
        </h1>
        {query && (
          <p className="text-text-secondary mt-1">
            Found {totalResultsCount} result(s) for query: <span className="font-semibold text-text-primary">"{query}"</span>
          </p>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-20">
          <div className="inline-block w-10 h-10 border-4 border-primary-650 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-text-secondary">Searching across all modules...</p>
        </div>
      )}

      {!query.trim() && (
        <Card className="p-12 text-center">
          <Search className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-primary">No search query</h3>
          <p className="text-text-secondary mt-1">Please enter a search term in the search bar above to see results.</p>
        </Card>
      )}

      {query.trim() && !isLoading && totalResultsCount === 0 && (
        <Card className="p-12 text-center">
          <Search className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-text-primary">No results found</h3>
          <p className="text-text-secondary mt-1">We couldn't find any records matching "{query}". Try checking your spelling or search terms.</p>
        </Card>
      )}

      {query.trim() && !isLoading && totalResultsCount > 0 && (
        <div className="space-y-8">
          {Object.entries(results).map(([moduleKey, items]) => {
            const config = moduleMappings[moduleKey] || {
              label: moduleKey.replace(/_/g, ' '),
              path: '/dashboard',
              bg: 'bg-secondary-50',
              text: 'text-text-primary',
            };

            return (
              <motion.div
                key={moduleKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between border-b border-secondary-200 dark:border-secondary-700 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${config.bg} ${config.text} uppercase tracking-wider`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-text-secondary">({items.length} match(es))</span>
                  </div>
                  <button
                    onClick={() => navigate(config.path)}
                    className="text-xs text-primary-600 hover:text-primary-800 font-semibold flex items-center gap-1 transition-colors"
                  >
                    Go to Module
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className="p-4 hover:shadow-medium border border-secondary-200 dark:border-secondary-800 hover:border-primary-200 dark:hover:border-primary-900 transition-all cursor-pointer flex flex-col justify-between"
                      onClick={() => navigate(`${config.path}?search=${item.id}`)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <Calendar className="w-3.5 h-3.5 text-secondary-405" />
                            <span className="font-medium">{formatDate(item.date)}</span>
                          </div>
                          {item.status && (
                            <Badge className={getStatusColor(item.status)}>
                              {getStatusLabel(item.status)}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm font-semibold text-text-primary">
                          {getSummaryText(moduleKey, item)}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-end text-xs font-bold text-primary-600 group-hover:text-primary-800 gap-1 pt-2 border-t border-secondary-100 dark:border-secondary-800">
                        <Eye className="w-3.5 h-3.5" />
                        View Record
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
