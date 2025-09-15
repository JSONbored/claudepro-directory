import { useState } from 'react';
import { ConfigCard } from '@/components/ConfigCard';
import { SearchBar } from '@/components/SearchBar';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Filter } from 'lucide-react';
import { rules, Rule, getRulesByCategory } from '@/data/rules';

const categories = [
  { id: 'all', name: 'All Rules', count: rules.length },
  { id: 'development', name: 'Development', count: getRulesByCategory('development').length },
  { id: 'writing', name: 'Writing', count: getRulesByCategory('writing').length },
  { id: 'creative', name: 'Creative', count: getRulesByCategory('creative').length },
  { id: 'business', name: 'Business', count: getRulesByCategory('business').length },
  { id: 'other', name: 'Other', count: getRulesByCategory('other').length },
];

const Rules = () => {
  const [filteredRules, setFilteredRules] = useState<Rule[]>(rules);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      setFilteredRules(rules);
    } else {
      setFilteredRules(getRulesByCategory(categoryId));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-primary/10 rounded-full">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-foreground">
              Claude Rules
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Expert-crafted system prompts and configurations to enhance Claude's capabilities 
              across different domains and use cases.
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary">
                <BookOpen className="h-3 w-3 mr-1" />
                {rules.length} Rules Available
              </Badge>
              <Badge variant="outline">
                Expert Tested
              </Badge>
              <Badge variant="outline">
                Copy & Paste Ready
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter by category:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`cursor-pointer transition-smooth hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary'
                    : 'border-border/50 hover:border-primary/30 hover:bg-primary/5 hover:text-primary'
                }`}
                onClick={() => handleCategoryFilter(category.id)}
              >
                {category.name} ({category.count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <SearchBar 
            data={selectedCategory === 'all' ? rules : getRulesByCategory(selectedCategory)}
            onFilteredResults={(results) => setFilteredRules(results as Rule[])}
            placeholder="Search Claude rules..."
          />
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRules.map((rule) => (
            <ConfigCard
              key={rule.id}
              {...rule}
              type="rule"
            />
          ))}
        </div>

        {filteredRules.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No rules found matching your criteria.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or selecting a different category.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Rules;