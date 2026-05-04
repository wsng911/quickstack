import { allTemplates, appTemplates, databaseTemplates } from '@/shared/templates/all.templates';
import { AppTemplateModel } from '@/shared/model/app-template.model';
import https from 'https';
import http from 'http';

describe('Template Icons', () => {
    describe('Icon URL Validation', () => {
        const isValidUrl = (urlString: string): boolean => {
            try {
                const url = new URL(urlString);
                return url.protocol === 'http:' || url.protocol === 'https:';
            } catch {
                return false;
            }
        };

        const checkTemplateIcon = (template: AppTemplateModel) => {
            const { name, icon名称 } = template;

            // Check if icon名称 exists
            expect(icon名称).toBeDefined();
            expect(typeof icon名称).toBe('string');

            if (!icon名称) return;

            // If it's a URL (starts with http:// or https://)
            if (icon名称.startsWith('http://') || icon名称.startsWith('https://')) {
                // Should be a valid URL
                expect(isValidUrl(icon名称)).toBe(true);

                // Should use https for security (warn if http)
                if (icon名称.startsWith('http://')) {
                    console.warn(`⚠️  Template "${name}" uses HTTP instead of HTTPS: ${icon名称}`);
                }

                // Should have a valid file extension for images or be from known CDN/repos
                const hasValidExtension = /\.(svg|png|jpg|jpeg|gif|ico|webp)$/i.test(icon名称);
                const isFromTrustedSource = 
                    icon名称.includes('github.com') || 
                    icon名称.includes('githubusercontent.com') ||
                    icon名称.includes('raw.githubusercontent.com') ||
                    icon名称.includes('cdn.jsdelivr.net') ||
                    icon名称.includes('cdn.simpleicons.org') ||
                    icon名称.includes('codeberg.org') ||
                    icon名称.includes('hub.docker.com') ||
                    icon名称.includes('redis.io') ||
                    icon名称.includes('jenkins.io') ||
                    icon名称.includes('sonarsource.com') ||
                    icon名称.includes('nodered.org') ||
                    icon名称.includes('plausible.io') ||
                    icon名称.includes('www.adminer.org');

                if (!hasValidExtension && !isFromTrustedSource) {
                    console.error(`❌ Template "${name}" has invalid icon URL: ${icon名称}`);
                }
                
                expect(hasValidExtension || isFromTrustedSource).toBe(true);
            } else {
                // If it's not a URL, it should be a filename
                expect(icon名称.length).toBeGreaterThan(0);
                expect(icon名称).toMatch(/\.(svg|png|jpg|jpeg|gif|ico|webp)$/i);
            }
        };

        test('All database templates should have valid icon URLs', () => {
            databaseTemplates.forEach(template => {
                checkTemplateIcon(template);
            });
        });

        test('All app templates should have valid icon URLs', () => {
            appTemplates.forEach(template => {
                checkTemplateIcon(template);
            });
        });

        test('No duplicate template names', () => {
            const names = allTemplates.map(t => t.name);
            const unique名称s = new Set(names);
            expect(names.length).toBe(unique名称s.size);
        });

        test('All templates should have non-empty names', () => {
            allTemplates.forEach(template => {
                expect(template.name).toBeDefined();
                expect(template.name.length).toBeGreaterThan(0);
            });
        });
    });

    describe('URL Format Validation', () => {
        test('All URL-based icons should use valid protocols', () => {
            const urlTemplates = allTemplates.filter(t => 
                t.icon名称?.startsWith('http://') || t.icon名称?.startsWith('https://')
            );

            urlTemplates.forEach(template => {
                expect(
                    template.icon名称?.startsWith('http://') || 
                    template.icon名称?.startsWith('https://')
                ).toBe(true);
            });
        });

        test('URL-based icons should not have spaces', () => {
            const urlTemplates = allTemplates.filter(t => 
                t.icon名称?.startsWith('http://') || t.icon名称?.startsWith('https://')
            );

            urlTemplates.forEach(template => {
                expect(template.icon名称).not.toContain(' ');
            });
        });

        test('URL-based icons should not have line breaks', () => {
            const urlTemplates = allTemplates.filter(t => 
                t.icon名称?.startsWith('http://') || t.icon名称?.startsWith('https://')
            );

            urlTemplates.forEach(template => {
                expect(template.icon名称).not.toContain('\n');
                expect(template.icon名称).not.toContain('\r');
            });
        });
    });

    describe('Template Structure', () => {
        test('All templates should have at least one template configuration', () => {
            allTemplates.forEach(template => {
                expect(template.templates).toBeDefined();
                expect(Array.isArray(template.templates)).toBe(true);
                expect(template.templates.length).toBeGreaterThan(0);
            });
        });

        test('All template configurations should have required fields', () => {
            allTemplates.forEach(template => {
                template.templates.forEach((config, index) => {
                    expect(config.input设置).toBeDefined();
                    expect(config.appModel).toBeDefined();
                    expect(config.appDomains).toBeDefined();
                    expect(config.appVolumes).toBeDefined();
                    expect(config.appFileMounts).toBeDefined();
                    expect(config.appPorts).toBeDefined();
                });
            });
        });
    });

    describe('Icon URL Accessibility Summary', () => {
        test('Generate summary of icon sources', () => {
            const urlTemplates = allTemplates.filter(t => 
                t.icon名称?.startsWith('http://') || t.icon名称?.startsWith('https://')
            );

            const sources: { [key: string]: number } = {};
            
            urlTemplates.forEach(template => {
                if (template.icon名称) {
                    const url = new URL(template.icon名称);
                    const hostname = url.hostname;
                    sources[hostname] = (sources[hostname] || 0) + 1;
                }
            });

            console.log('\n📊 Icon URL Sources Summary:');
            Object.entries(sources)
                .sort((a, b) => b[1] - a[1])
                .forEach(([source, count]) => {
                    console.log(`   ${source}: ${count} template(s)`);
                });
            
            console.log(`\n✅ Total templates with URL icons: ${urlTemplates.length}`);
            console.log(`📁 Total templates with local icons: ${allTemplates.length - urlTemplates.length}`);
            console.log(`📦 Total templates: ${allTemplates.length}`);

            expect(urlTemplates.length).toBeGreaterThan(0);
        });
    });

    describe('Icon URL Accessibility (HTTP Fetch)', () => {
        test('All URL-based icons should be accessible via HTTP', async () => {
            const urlTemplates = allTemplates.filter(t => 
                t.icon名称?.startsWith('http://') || t.icon名称?.startsWith('https://')
            );

            const failedUrls: { name: string; url: string; error: string }[] = [];
            const successfulUrls: string[] = [];

            console.log('\n🔍 Testing HTTP accessibility for icon URLs...\n');

            // Helper function to make HEAD request
            const testUrl = (url: string): Promise<{ statusCode: number; statusMessage: string }> => {
                return new Promise((resolve, reject) => {
                    const urlObj = new URL(url);
                    const client = urlObj.protocol === 'https:' ? https : http;
                    
                    const options = {
                        method: 'HEAD',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (compatible; QuickStack-IconTest/1.0)',
                        },
                        timeout: 10000, // 10 second timeout per request
                    };

                    const req = client.request(url, options, (res) => {
                        resolve({
                            statusCode: res.statusCode || 0,
                            statusMessage: res.statusMessage || ''
                        });
                    });

                    req.on('error', (error) => {
                        reject(error);
                    });

                    req.on('timeout', () => {
                        req.destroy();
                        reject(new Error('Request timeout'));
                    });

                    req.end();
                });
            };

            for (const template of urlTemplates) {
                if (!template.icon名称) continue;

                try {
                    const { statusCode, statusMessage } = await testUrl(template.icon名称);

                    if (statusCode >= 200 && statusCode < 400) {
                        successfulUrls.push(template.icon名称);
                        console.log(`   ✅ ${template.name}: ${statusCode}`);
                    } else {
                        failedUrls.push({
                            name: template.name,
                            url: template.icon名称,
                            error: `HTTP ${statusCode} ${statusMessage}`
                        });
                        console.error(`   ❌ ${template.name}: ${statusCode} ${statusMessage}`);
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    failedUrls.push({
                        name: template.name,
                        url: template.icon名称,
                        error: errorMessage
                    });
                    console.error(`   ❌ ${template.name}: ${errorMessage}`);
                }

                // 添加 a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log(`\n📊 Results:`);
            console.log(`   ✅ Successful: ${successfulUrls.length}`);
            console.log(`   ❌ Failed: ${failedUrls.length}`);

            if (failedUrls.length > 0) {
                console.error('\n❌ Failed URLs that need to be replaced:');
                failedUrls.forEach(({ name, url, error }) => {
                    console.error(`   - ${name}:`);
                    console.error(`     URL: ${url}`);
                    console.error(`     Error: ${error}`);
                });
            }

            expect(failedUrls.length).toBe(0);
        }, 60000); // 60 second timeout for all fetches
    });
});
