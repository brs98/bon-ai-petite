'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { GROCERY_CATEGORIES } from '@/types/recipe';
import {
  Check,
  Download,
  Edit3,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface ShoppingListIngredient {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  checked: boolean;
  recipeNames?: string[]; // Which recipes this ingredient came from
  recipeIds?: number[]; // Recipe IDs for viewing functionality
}

interface ShoppingListProps {
  ingredients: ShoppingListIngredient[];
  planName?: string;
  onIngredientToggle: (ingredientId: string, checked: boolean) => void;
  onIngredientEdit: (
    ingredientId: string,
    ingredient: Partial<ShoppingListIngredient>,
  ) => void;
  onIngredientAdd: (
    ingredient: Omit<ShoppingListIngredient, 'id' | 'checked'>,
  ) => void;
  onIngredientRemove: (ingredientId: string) => void;
  onExport?: (format: 'json' | 'csv' | 'text') => void;
  onRefresh?: () => void;
  onViewRecipe?: (recipeId: number) => void;
  isEditable?: boolean;
  showRecipeOrigins?: boolean;
  disabled?: boolean;
}

const CATEGORY_ICONS = {
  produce: '🥬',
  dairy: '🥛',
  meat: '🥩',
  poultry: '🐔',
  seafood: '🐟',
  bakery: '🍞',
  deli: '🧀',
  frozen: '❄️',
  pantry: '🏺',
  spices: '🧂',
  beverages: '🧃',
  snacks: '🍿',
  health: '💊',
  other: '📦',
} as const;

const CATEGORY_LABELS = {
  produce: 'Produce',
  dairy: 'Dairy & Eggs',
  meat: 'Meat',
  poultry: 'Poultry',
  seafood: 'Seafood',
  bakery: 'Bakery',
  deli: 'Deli',
  frozen: 'Frozen',
  pantry: 'Pantry & Canned',
  spices: 'Spices & Seasonings',
  beverages: 'Beverages',
  snacks: 'Snacks',
  health: 'Health & Wellness',
  other: 'Other',
} as const;

const UNITS = [
  'cups',
  'tbsp',
  'tsp',
  'oz',
  'lbs',
  'g',
  'kg',
  'ml',
  'L',
  'pieces',
  'cloves',
  'slices',
  'bunches',
  'packages',
  'cans',
  'bottles',
] as const;

export function ShoppingList({
  ingredients,
  planName,
  onIngredientToggle,
  onIngredientEdit,
  onIngredientAdd,
  onIngredientRemove,
  onExport,
  onRefresh,
  onViewRecipe,
  isEditable = true,
  showRecipeOrigins = true,
  disabled = false,
}: ShoppingListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showChecked, setShowChecked] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    quantity: 1,
    unit: 'pieces',
    category: 'other',
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Organize ingredients by category
  const organizedIngredients = useMemo(() => {
    // Safety check: ensure ingredients is an array
    if (!ingredients || !Array.isArray(ingredients)) {
      return {};
    }

    const filtered = ingredients.filter(ingredient => {
      const matchesSearch = ingredient.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === 'all' || ingredient.category === filterCategory;
      const matchesChecked = showChecked || !ingredient.checked;
      return matchesSearch && matchesCategory && matchesChecked;
    });

    const organized: Record<string, ShoppingListIngredient[]> = {};

    filtered.forEach(ingredient => {
      const category = ingredient.category || 'other';
      if (!organized[category]) {
        organized[category] = [];
      }
      organized[category].push(ingredient);
    });

    // Sort ingredients within each category
    Object.keys(organized).forEach(category => {
      organized[category].sort((a, b) => {
        if (a.checked !== b.checked) {
          return a.checked ? 1 : -1; // Unchecked items first
        }
        return a.name.localeCompare(b.name);
      });
    });

    return organized;
  }, [ingredients, searchTerm, filterCategory, showChecked]);

  // Calculate statistics
  const stats = useMemo(() => {
    // Safety check: ensure ingredients is an array
    if (!ingredients || !Array.isArray(ingredients)) {
      return { total: 0, checked: 0, unchecked: 0, categories: 0 };
    }

    const total = ingredients.length;
    const checked = ingredients.filter(i => i.checked).length;
    const categories = new Set(ingredients.map(i => i.category || 'other'))
      .size;

    return { total, checked, unchecked: total - checked, categories };
  }, [ingredients]);

  const handleIngredientToggle = (ingredient: ShoppingListIngredient) => {
    if (ingredient.id) {
      onIngredientToggle(ingredient.id, !ingredient.checked);
    }
  };

  const handleAddIngredient = () => {
    if (newIngredient.name.trim()) {
      onIngredientAdd({
        ...newIngredient,
        name: newIngredient.name.trim(),
      });
      setNewIngredient({
        name: '',
        quantity: 1,
        unit: 'pieces',
        category: 'other',
      });
      setShowAddForm(false);
    }
  };

  const handleEditSave = (
    ingredient: ShoppingListIngredient,
    newName: string,
    newQuantity: number,
    newUnit: string,
  ) => {
    if (ingredient.id && newName.trim()) {
      onIngredientEdit(ingredient.id, {
        name: newName.trim(),
        quantity: newQuantity,
        unit: newUnit,
      });
      setEditingId(null);
    }
  };

  const formatQuantity = (quantity: number, unit: string) => {
    if (quantity === Math.floor(quantity)) {
      return `${quantity} ${unit}`;
    }
    return `${quantity.toFixed(2)} ${unit}`;
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <ShoppingCart className='h-6 w-6 text-primary' />
              <div>
                <CardTitle className='text-xl'>Shopping List</CardTitle>
                {planName && (
                  <p className='text-sm text-muted-foreground'>
                    For meal plan: {planName}
                  </p>
                )}
              </div>
            </div>

            <div className='flex items-center gap-2'>
              {onRefresh && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={onRefresh}
                  disabled={disabled}
                >
                  <RefreshCw className='h-4 w-4' />
                </Button>
              )}

              {onExport && (
                <Select
                  onValueChange={(format: 'json' | 'csv' | 'text') =>
                    onExport(format)
                  }
                >
                  <SelectTrigger className='w-32'>
                    <Download className='h-4 w-4 mr-2' />
                    <SelectValue placeholder='Export' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='text'>Text</SelectItem>
                    <SelectItem value='csv'>CSV</SelectItem>
                    <SelectItem value='json'>JSON</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* Statistics */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-primary'>
                {stats.total}
              </div>
              <div className='text-sm text-muted-foreground'>Total Items</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {stats.checked}
              </div>
              <div className='text-sm text-muted-foreground'>Completed</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-amber-600'>
                {stats.unchecked}
              </div>
              <div className='text-sm text-muted-foreground'>Remaining</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {stats.categories}
              </div>
              <div className='text-sm text-muted-foreground'>Categories</div>
            </div>
          </div>

          {/* Filters */}
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search ingredients...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
                disabled={disabled}
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className='w-48'>
                <Filter className='h-4 w-4 mr-2' />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Categories</SelectItem>
                {GROCERY_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    <div className='flex items-center gap-2'>
                      <span>{CATEGORY_ICONS[category]}</span>
                      <span>{CATEGORY_LABELS[category]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className='flex items-center space-x-2'>
              <Checkbox
                id='show-checked'
                checked={showChecked}
                onCheckedChange={checked => setShowChecked(checked === true)}
                disabled={disabled}
              />
              <Label htmlFor='show-checked' className='text-sm'>
                Show completed items
              </Label>
            </div>
          </div>

          {/* Add New Ingredient */}
          {isEditable && (
            <div className='space-y-3'>
              {!showAddForm ? (
                <Button
                  variant='outline'
                  onClick={() => setShowAddForm(true)}
                  disabled={disabled}
                  className='w-full'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Add Custom Ingredient
                </Button>
              ) : (
                <Card className='p-4'>
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                    <div className='md:col-span-2'>
                      <Input
                        placeholder='Ingredient name'
                        value={newIngredient.name}
                        onChange={e =>
                          setNewIngredient(prev => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <Input
                        type='number'
                        min='0.1'
                        step='0.1'
                        placeholder='Qty'
                        value={newIngredient.quantity}
                        onChange={e =>
                          setNewIngredient(prev => ({
                            ...prev,
                            quantity: parseFloat(e.target.value) || 1,
                          }))
                        }
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <Select
                        value={newIngredient.unit}
                        onValueChange={value =>
                          setNewIngredient(prev => ({ ...prev, unit: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map(unit => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className='flex items-center justify-between mt-3'>
                    <Select
                      value={newIngredient.category}
                      onValueChange={value =>
                        setNewIngredient(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger className='w-48'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GROCERY_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            <div className='flex items-center gap-2'>
                              <span>{CATEGORY_ICONS[category]}</span>
                              <span>{CATEGORY_LABELS[category]}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setShowAddForm(false)}
                        disabled={disabled}
                      >
                        Cancel
                      </Button>
                      <Button
                        size='sm'
                        onClick={handleAddIngredient}
                        disabled={disabled || !newIngredient.name.trim()}
                      >
                        Add Item
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shopping List Items by Category */}
      <div className='space-y-4'>
        {Object.entries(organizedIngredients).map(
          ([category, categoryIngredients]) => (
            <Card key={category}>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span className='text-xl'>
                      {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}
                    </span>
                    <CardTitle className='text-lg'>
                      {
                        CATEGORY_LABELS[
                          category as keyof typeof CATEGORY_LABELS
                        ]
                      }
                    </CardTitle>
                    <Badge variant='outline'>
                      {categoryIngredients.length} item
                      {categoryIngredients.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <Badge
                    variant={
                      categoryIngredients.filter(i => i.checked).length ===
                      categoryIngredients.length
                        ? 'default'
                        : 'secondary'
                    }
                    className='text-xs'
                  >
                    {categoryIngredients.filter(i => i.checked).length}/
                    {categoryIngredients.length} complete
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className='space-y-2'>
                  {categoryIngredients.map(ingredient => (
                    <div
                      key={ingredient.id || ingredient.name}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-all',
                        ingredient.checked
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                          : 'bg-background hover:bg-muted/50',
                      )}
                    >
                      <Checkbox
                        checked={ingredient.checked}
                        onCheckedChange={() =>
                          handleIngredientToggle(ingredient)
                        }
                        disabled={disabled}
                      />

                      <div className='flex-1'>
                        {editingId === ingredient.id ? (
                          <EditIngredientForm
                            ingredient={ingredient}
                            onSave={handleEditSave}
                            onCancel={() => setEditingId(null)}
                            disabled={disabled}
                          />
                        ) : (
                          <div
                            className={cn(
                              'space-y-1',
                              ingredient.checked && 'opacity-75',
                            )}
                          >
                            <div className='flex items-center justify-between'>
                              <span
                                className={cn(
                                  'font-medium',
                                  ingredient.checked && 'line-through',
                                )}
                              >
                                {ingredient.name}
                              </span>
                              <span className='text-sm text-muted-foreground'>
                                {formatQuantity(
                                  ingredient.quantity,
                                  ingredient.unit,
                                )}
                              </span>
                            </div>

                            {showRecipeOrigins &&
                              ingredient.recipeNames &&
                              ingredient.recipeNames.length > 0 && (
                                <div className='flex flex-wrap gap-1'>
                                  {ingredient.recipeNames.map(
                                    (recipeName, index) => {
                                      const recipeId =
                                        ingredient.recipeIds?.[index];
                                      return (
                                        <Badge
                                          key={index}
                                          variant='outline'
                                          className={cn(
                                            'text-xs',
                                            recipeId && onViewRecipe
                                              ? 'cursor-pointer hover:bg-primary/10 hover:border-primary'
                                              : '',
                                          )}
                                          onClick={() => {
                                            if (recipeId && onViewRecipe) {
                                              onViewRecipe(recipeId);
                                            }
                                          }}
                                          title={
                                            recipeId && onViewRecipe
                                              ? 'Click to view recipe'
                                              : undefined
                                          }
                                        >
                                          {recipeName}
                                        </Badge>
                                      );
                                    },
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                      </div>

                      {isEditable && !ingredient.checked && (
                        <div className='flex items-center gap-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setEditingId(ingredient.id || null)}
                            disabled={disabled || editingId !== null}
                          >
                            <Edit3 className='h-4 w-4' />
                          </Button>

                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() =>
                              ingredient.id && onIngredientRemove(ingredient.id)
                            }
                            disabled={disabled}
                            className='text-destructive hover:text-destructive'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ),
        )}

        {Object.keys(organizedIngredients).length === 0 && (
          <Card>
            <CardContent className='text-center py-12'>
              <ShoppingCart className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-medium text-muted-foreground mb-2'>
                No items found
              </h3>
              <p className='text-sm text-muted-foreground'>
                {searchTerm || filterCategory !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Your shopping list is empty'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface EditIngredientFormProps {
  ingredient: ShoppingListIngredient;
  onSave: (
    ingredient: ShoppingListIngredient,
    name: string,
    quantity: number,
    unit: string,
  ) => void;
  onCancel: () => void;
  disabled?: boolean;
}

function EditIngredientForm({
  ingredient,
  onSave,
  onCancel,
  disabled,
}: EditIngredientFormProps) {
  const [name, setName] = useState(ingredient.name);
  const [quantity, setQuantity] = useState(ingredient.quantity);
  const [unit, setUnit] = useState(ingredient.unit);

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        disabled={disabled}
        className='md:col-span-1'
      />
      <div className='flex gap-1'>
        <Input
          type='number'
          min='0.1'
          step='0.1'
          value={quantity}
          onChange={e => setQuantity(parseFloat(e.target.value) || 1)}
          disabled={disabled}
          className='w-20'
        />
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger className='w-24'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNITS.map(unitOption => (
              <SelectItem key={unitOption} value={unitOption}>
                {unitOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='flex gap-1'>
        <Button
          variant='outline'
          size='sm'
          onClick={onCancel}
          disabled={disabled}
        >
          <X className='h-4 w-4' />
        </Button>
        <Button
          size='sm'
          onClick={() => onSave(ingredient, name, quantity, unit)}
          disabled={disabled || !name.trim()}
        >
          <Check className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
