
import React from 'react';
import { useGlobal } from '../context/GlobalState';
import { 
  Download, FileSpreadsheet, FileIcon as FilePdf, 
  Copy, Share2, Plus, Trash2, Edit 
} from 'lucide-react';

interface Column {
  key: string;
  label: string;
}

interface DynamicTableProps {
  title: string;
  columns: Column[];
  data: any[];
  onAdd: () => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

const DynamicTable: React.FC<DynamicTableProps> = ({ title, columns, data, onAdd, onEdit, onDelete }) => {
  const { lang } = useGlobal();

  const handleShareWhatsApp = (item?: any) => {
    let text = `*📋 تقرير: ${title}*\n\n`;
    const targetData = item ? [item] : data;

    targetData.forEach((row, idx) => {
      text += `🔹 *بند ${idx + 1}:*\n`;
      columns.forEach(col => {
        text += `▪️ ${col.label}: ${row[col.key]}\n`;
      });
      text += `\n`;
    });

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyToClipboard = () => {
    const text = data.map(row => 
      columns.map(col => `${col.label}: ${row[col.key]}`).join(' | ')
    ).join('\n');
    navigator.clipboard.writeText(text);
    alert(lang === 'ar' ? 'تم النسخ بنجاح' : 'Copied successfully');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <div className="flex items-center gap-2">
          <button onClick={onAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة' : 'Add'}</span>
          </button>
          
          <div className="flex items-center border rounded-lg p-1 bg-slate-50">
            <button onClick={handleCopyToClipboard} className="p-2 hover:bg-white rounded text-blue-600 transition-colors" title="Copy">
              <Copy className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-white rounded text-green-600 transition-colors" title="Excel">
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-white rounded text-red-600 transition-colors" title="PDF">
              <FilePdf className="w-4 h-4" />
            </button>
            <button onClick={() => handleShareWhatsApp()} className="p-2 hover:bg-white rounded text-green-500 transition-colors" title="WhatsApp Report">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b">
              {columns.map(col => (
                <th key={col.key} className="px-6 py-4 text-start">{col.label}</th>
              ))}
              <th className="px-6 py-4 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-400 italic">
                  {lang === 'ar' ? 'لا توجد بيانات حالياً' : 'No data available'}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-6 py-4 text-sm text-slate-700">
                      {row[col.key]}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onEdit(row)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => onDelete(row.id)}
                         className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => handleShareWhatsApp(row)}
                         className="p-1.5 text-green-500 hover:bg-green-50 rounded transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DynamicTable;
