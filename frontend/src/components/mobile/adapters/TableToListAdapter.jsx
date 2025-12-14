/**
 * TableToListAdapter - Convertit un tableau desktop en liste mobile
 * 
 * Adaptateur qui transforme automatiquement les données tabulaires
 * en une liste de cartes mobiles.
 * 
 * @usage
 * import TableToListAdapter from '@/components/mobile/adapters/TableToListAdapter';
 * <TableToListAdapter 
 *   columns={[
 *     { key: 'name', label: 'Nom', isPrimary: true },
 *     { key: 'email', label: 'Email', isSecondary: true },
 *     { key: 'status', label: 'Statut', isBadge: true }
 *   ]}
 *   rows={users}
 *   onRowClick={(row) => navigate(`/user/${row.id}`)}
 *   actions={[
 *     { icon: Eye, label: 'Voir', onClick: (row) => view(row) },
 *     { icon: Edit, label: 'Modifier', onClick: (row) => edit(row) }
 *   ]}
 * />
 */

import { useState } from 'react';
import MobileCard from '../MobileCard';
import MobileList from '../MobileList';
import { useLanguage } from '../../../hooks/useLanguage';
import { Filter, SortAsc, SortDesc } from 'lucide-react';

const TableToListAdapter = ({
    columns = [],
    rows = [],
    onRowClick,
    actions = [],
    swipeActions = [],
    keyExtractor = (row) => row.id,
    sortable = false,
    filterable = false,
    emptyMessage,
    emptyIcon,
    className = ''
}) => {
    const { isRTL } = useLanguage();
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [filterText, setFilterText] = useState('');

    // Trouver les colonnes principales
    const primaryColumn = columns.find(c => c.isPrimary) || columns[0];
    const secondaryColumn = columns.find(c => c.isSecondary) || columns[1];
    const badgeColumn = columns.find(c => c.isBadge);
    const detailColumns = columns.filter(c => !c.isPrimary && !c.isSecondary && !c.isBadge && !c.hidden);

    // Tri des données
    const sortedRows = [...rows].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Filtrage des données
    const filteredRows = filterText
        ? sortedRows.filter(row =>
            columns.some(col =>
                String(row[col.key]).toLowerCase().includes(filterText.toLowerCase())
            )
        )
        : sortedRows;

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getBadgeColor = (value, column) => {
        if (column.badgeColors && column.badgeColors[value]) {
            return column.badgeColors[value];
        }
        // Couleurs par défaut basées sur des valeurs communes
        const lowerValue = String(value).toLowerCase();
        if (['active', 'actif', 'présent', 'present', 'enrolled', 'inscrit', 'approved', 'approuvé'].includes(lowerValue)) {
            return 'green';
        }
        if (['inactive', 'inactif', 'absent', 'rejected', 'rejeté', 'cancelled', 'annulé'].includes(lowerValue)) {
            return 'red';
        }
        if (['pending', 'en attente', 'waiting', 'new', 'nouveau'].includes(lowerValue)) {
            return 'orange';
        }
        return 'gray';
    };

    const formatValue = (value, column) => {
        if (column.render) {
            return column.render(value);
        }
        if (column.type === 'date' && value) {
            return new Date(value).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR');
        }
        if (column.type === 'boolean') {
            return value ? (isRTL ? 'نعم' : 'Oui') : (isRTL ? 'لا' : 'Non');
        }
        return value ?? '-';
    };

    const renderItem = (row) => {
        const badge = badgeColumn && row[badgeColumn.key] ? {
            text: formatValue(row[badgeColumn.key], badgeColumn),
            color: getBadgeColor(row[badgeColumn.key], badgeColumn)
        } : null;

        const cardActions = actions.map(action => ({
            ...action,
            onClick: () => action.onClick(row)
        }));

        return (
            <MobileCard
                title={formatValue(row[primaryColumn?.key], primaryColumn)}
                subtitle={secondaryColumn ? formatValue(row[secondaryColumn.key], secondaryColumn) : null}
                badge={badge}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                showChevron={!!onRowClick}
                actions={cardActions}
            >
                {detailColumns.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {detailColumns.map(col => (
                            <div key={col.key}>
                                <span className="text-gray-500 dark:text-gray-400">{col.label}:</span>
                                <span className="ml-1 rtl:mr-1 rtl:ml-0 text-gray-900 dark:text-white">
                                    {formatValue(row[col.key], col)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </MobileCard>
        );
    };

    return (
        <div className={className}>
            {/* Filter & Sort Controls */}
            {(filterable || sortable) && (
                <div className="flex items-center gap-2 mb-4">
                    {filterable && (
                        <div className="flex-1 relative">
                            <Filter className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                placeholder={isRTL ? 'فلترة...' : 'Filtrer...'}
                                className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm"
                            />
                        </div>
                    )}
                    {sortable && (
                        <div className="flex gap-1">
                            {columns.filter(c => c.sortable !== false).slice(0, 2).map(col => (
                                <button
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${sortConfig.key === col.key
                                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {col.label}
                                    {sortConfig.key === col.key && (
                                        sortConfig.direction === 'asc'
                                            ? <SortAsc className="w-3 h-3" />
                                            : <SortDesc className="w-3 h-3" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Results count */}
            {filterText && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {filteredRows.length} {isRTL ? 'نتيجة' : 'résultat(s)'}
                </p>
            )}

            {/* List */}
            <MobileList
                items={filteredRows}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                swipeActions={swipeActions.map(action => ({
                    ...action,
                    onClick: (row) => action.onClick(row)
                }))}
                emptyMessage={emptyMessage}
                emptyIcon={emptyIcon}
            />
        </div>
    );
};

export default TableToListAdapter;
